import type { WorkflowData } from "./workflowModel";
export type Kind = "categories" | "levels" | "competencies" | "skills";
export type RecordItem = {
  id: string;
  name: string;
  description: string;
  status: "Active" | "Inactive" | "Draft";
  categoryId?: string;
  competencyId?: string;
  levels?: Record<string, string>;
};
export type Assignment = {
  id: string;
  name: string;
  skillId: string;
  expected: string;
  current: string;
  department: string;
  updatedBy?: "Admin" | "Manager";
};
export type Data = Record<Kind, RecordItem[]> & {
  assignments: Assignment[];
  workflow?: WorkflowData;
};
export const key = "axle-competency-v1";
export const uid = () => crypto.randomUUID();
export const seed: Data = {
  categories: [
    {
      id: "foundation",
      name: "Foundation",
      description: "Essential capabilities for every role",
      status: "Active",
    },
    {
      id: "technical",
      name: "Technical",
      description: "Specialist knowledge and practical expertise",
      status: "Active",
    },
    {
      id: "managerial",
      name: "Managerial",
      description: "Leading people and delivering outcomes",
      status: "Active",
    },
  ],
  levels: ["Beginner", "Intermediate", "Advanced", "Expert"].map((name, i) => ({
    id: "l" + i,
    name,
    description: [
      "Understands the fundamentals",
      "Applies the skill with guidance",
      "Works independently",
      "Coaches others and solves complex problems",
    ][i],
    status: "Active",
  })),
  competencies: [
    {
      id: "communication",
      name: "Communication",
      description:
        "Connect clearly, listen actively, and share ideas with confidence.",
      categoryId: "foundation",
      status: "Active",
    },
    {
      id: "data",
      name: "Data Analysis",
      description: "Turn data into meaningful insights and better decisions.",
      categoryId: "technical",
      status: "Active",
    },
    {
      id: "leadership",
      name: "People Leadership",
      description: "Build trust and help teams do their best work.",
      categoryId: "managerial",
      status: "Draft",
    },
  ],
  skills: [
    {
      id: "listening",
      name: "Active Listening",
      description: "Understand others through attentive listening.",
      categoryId: "foundation",
      competencyId: "communication",
      status: "Active",
      levels: {
        l0: "Recognizes key points",
        l1: "Asks clarifying questions",
        l2: "Synthesizes perspectives",
        l3: "Coaches effective listening",
      },
    },
    {
      id: "speaking",
      name: "Public Speaking",
      description: "Present ideas clearly to an audience.",
      categoryId: "foundation",
      competencyId: "communication",
      status: "Active",
      levels: {
        l0: "Presents a short introduction",
        l1: "Delivers structured presentations",
        l2: "Adapts to the audience",
        l3: "Coaches persuasive speaking",
      },
    },
    {
      id: "excel",
      name: "Excel Reporting",
      description: "Build accurate, useful reports.",
      categoryId: "technical",
      competencyId: "data",
      status: "Active",
      levels: {
        l0: "Uses basic formulas",
        l1: "Builds pivot tables",
        l2: "Creates dashboards",
        l3: "Automates complex reporting",
      },
    },
  ],
  assignments: [
    {
      id: "a1",
      name: "Ananya R.",
      department: "Sales",
      skillId: "listening",
      current: "l0",
      expected: "l3",
    },
    {
      id: "a2",
      name: "Rahul K.",
      department: "Support",
      skillId: "excel",
      current: "l2",
      expected: "l2",
    },
    {
      id: "a3",
      name: "Ananya R.",
      department: "Sales",
      skillId: "speaking",
      current: "",
      expected: "l2",
    },
  ],
};
export function readData(): Data {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return structuredClone(seed);
    const data = JSON.parse(saved);
    if (
      !["categories", "levels", "competencies", "skills", "assignments"].every(
        (k) => Array.isArray(data[k]),
      )
    )
      throw Error();
    return data;
  } catch {
    return structuredClone(seed);
  }
}
export function used(data: Data, kind: Kind, id: string) {
  if (
    kind === "skills" &&
    data.workflow?.courses.some((c) => c.mappings.some((m) => m.skillId === id))
  )
    return true;
  if (
    kind === "levels" &&
    data.workflow?.courses.some((c) => c.mappings.some((m) => m.levelId === id))
  )
    return true;
  if (
    kind === "skills" &&
    data.workflow?.plans.some((p) => p.skills.some((s) => s.skillId === id))
  )
    return true;
  if (
    kind === "levels" &&
    data.workflow?.plans.some((p) => p.skills.some((s) => s.expected === id))
  )
    return true;
  return kind === "categories"
    ? data.competencies.some((x) => x.categoryId === id) ||
        data.skills.some((x) => x.categoryId === id)
    : kind === "competencies"
      ? data.skills.some((x) => x.competencyId === id)
      : kind === "skills"
        ? data.assignments.some((x) => x.skillId === id)
        : data.skills.some((x) => Object.hasOwn(x.levels || {}, id)) ||
          data.assignments.some((x) => x.current === id || x.expected === id);
}
export function progress(data: Data, a: Assignment) {
  if (!a.current) return "Yet to Start";
  return data.levels.findIndex((x) => x.id === a.current) >=
    data.levels.findIndex((x) => x.id === a.expected)
    ? "Completed"
    : "In Progress";
}
export function csv(rows: string[][]) {
  return (
    "\uFEFF" +
    rows
      .map((row) =>
        row
          .map(
            (v) =>
              '"' +
              (/^[=+@\-\t\r]/.test(v) ? "'" + v : v).replace(/"/g, '""') +
              '"',
          )
          .join(","),
      )
      .join("\r\n")
  );
}
export function download(name: string, rows: string[][]) {
  const url = URL.createObjectURL(
    new Blob([csv(rows)], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  const value = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (c === '"') {
      if (quoted && value[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (quoted || cell === "") {
        quoted = !quoted;
      } else
        throw Error(
          "Unexpected quote in CSV. Use the template and save as CSV.",
        );
    } else if (c === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && value[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw Error("A quoted value is not closed.");
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
export function validate(item: RecordItem, kind: Kind, data: Data): string[] {
  const errors: string[] = [];
  if (
    kind === "competencies" &&
    data.skills.some(
      (s) => s.competencyId === item.id && s.categoryId !== item.categoryId,
    )
  )
    errors.push(
      "This competency has skills. Keep its category consistent with those skills.",
    );
  if (!item.name.trim()) errors.push("Name is required.");
  if (item.name.length > 120)
    errors.push("Name must be 120 characters or fewer.");
  if (
    data[kind].some(
      (x) =>
        x.id !== item.id &&
        x.name.toLowerCase() === item.name.trim().toLowerCase(),
    )
  )
    errors.push("This name already exists.");
  if (
    !(
      kind === "competencies"
        ? ["Active", "Inactive", "Draft"]
        : ["Active", "Inactive"]
    ).includes(item.status)
  )
    errors.push("Choose a valid status.");
  if (kind === "competencies" || kind === "skills") {
    if (
      !data.categories.some(
        (x) => x.id === item.categoryId && x.status === "Active",
      )
    )
      errors.push("Choose an active category.");
  }
  if (kind === "skills") {
    if (
      !data.competencies.some(
        (x) =>
          x.id === item.competencyId &&
          x.categoryId === item.categoryId &&
          x.status === "Active",
      )
    )
      errors.push("Choose an active competency in this category.");
    for (const l of data.levels.filter((x) => x.status === "Active"))
      if (!item.levels?.[l.id]?.trim())
        errors.push(l.name + " description is required.");
  }
  if (item.status === "Inactive" && used(data, kind, item.id))
    errors.push("This item is in use and cannot be deactivated.");
  return errors;
}
