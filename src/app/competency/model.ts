import type { WorkflowData } from "./workflowModel";
export type Kind = "categories" | "levels" | "competencies" | "skills";
export type RecordItem = {
  id: string;
  name: string;
  description: string;
  status: "Active" | "Inactive" | "Draft";
  order?: number;
  categoryId?: string;
  /** Primary competency (first of competencyIds); kept for older saved data. */
  competencyId?: string;
  /** A skill can belong to many competencies. */
  competencyIds?: string[];
  /** Proficiency levels this skill uses; undefined means every active level. */
  levelIds?: string[];
  levels?: Record<string, string>;
  courses?: Record<string, string>;
  /** Competency only: the order its skills are shown in (set by drag and drop). */
  skillOrder?: string[];
  /** Competency only: skillId → highest level this competency requires ("Required up to"). Unset means all the skill's levels. */
  skillTargets?: Record<string, string>;
};
export type Assignment = {
  id: string;
  name: string;
  skillId: string;
  expected: string;
  current: string;
  department: string;
  updatedBy?: "Admin" | "Manager";
  employeeId?: string;
  /** Competency the skill was assigned under (from Role Mapping); decides its "Required up to" levels. */
  competencyId?: string;
  assignedDate?: string;
  completedDate?: string;
  levelHistory?: {
    from: string;
    to: string;
    at: string;
    by: string;
    reason: string;
  }[];
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
    order: i + 1,
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
/** All competencies a skill belongs to (supports older single-competency data). */
export function compIdsOf(s?: RecordItem | null): string[] {
  if (!s) return [];
  return s.competencyIds ?? (s.competencyId ? [s.competencyId] : []);
}
export const inComp = (s: RecordItem | undefined | null, cId: string) => compIdsOf(s).includes(cId);
/** Set a skill's competencies, keeping competencyId as the first one. */
export function withComps(s: RecordItem, ids: string[]): RecordItem {
  const unique = [...new Set(ids.filter(Boolean))];
  return { ...s, competencyIds: unique, competencyId: unique[0] ?? "" };
}
/** Active proficiency levels that apply to a skill, in level order. */
export function skillLevels(data: Data, s?: RecordItem | null): RecordItem[] {
  const active = data.levels
    .filter((l) => l.status === "Active")
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  if (!s?.levelIds) return active;
  // Levels run in order from the first level up to the highest one the skill uses.
  const top = Math.max(0, ...active.map((l, i) => (s.levelIds!.includes(l.id) ? i : -1)));
  return active.slice(0, top + 1);
}
/** Skills in a competency, in the order set on Create/Edit Competency. Unordered skills follow. */
export function compSkills(data: Data, compId: string): RecordItem[] {
  const order = data.competencies.find((c) => c.id === compId)?.skillOrder ?? [];
  const rank = (id: string) => { const i = order.indexOf(id); return i < 0 ? order.length : i; };
  return data.skills
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => inComp(s, compId))
    .sort((a, b) => rank(a.s.id) - rank(b.s.id) || a.i - b.i)
    .map(({ s }) => s);
}
/** A skill's levels as required by one competency: from the first level up to its "Required up to" level. */
export function compSkillLevels(data: Data, compId: string | undefined, s?: RecordItem | null): RecordItem[] {
  const levels = skillLevels(data, s);
  const target = compId && s ? data.competencies.find((c) => c.id === compId)?.skillTargets?.[s.id] : undefined;
  const i = target ? levels.findIndex((l) => l.id === target) : -1;
  return i < 0 ? levels : levels.slice(0, i + 1);
}
/**
 * Levels a learner works through for one assigned skill: the skill's levels up to the
 * competency's "Required up to" level, always reaching the learner's current and expected levels.
 */
export function assignmentLevels(data: Data, a: Pick<Assignment, "skillId" | "competencyId" | "current" | "expected">): RecordItem[] {
  const skill = data.skills.find((x) => x.id === a.skillId);
  const comps = compIdsOf(skill);
  const cId = a.competencyId && comps.includes(a.competencyId) ? a.competencyId : comps[0];
  const all = skillLevels(data, skill);
  const required = compSkillLevels(data, cId, skill);
  const reach = Math.max(required.length - 1, all.findIndex((l) => l.id === a.current), all.findIndex((l) => l.id === a.expected));
  return all.slice(0, reach + 1);
}
/** "Communication, Customer Focus" for display. */
export function compNames(data: Data, s?: RecordItem | null): string {
  return compIdsOf(s)
    .map((id) => data.competencies.find((c) => c.id === id)?.name)
    .filter(Boolean)
    .join(", ");
}
function normalize(data: Data): Data {
  data.skills = data.skills.map((s) => withComps(s, compIdsOf(s)));
  return data;
}
export function readData(): Data {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return normalize(structuredClone(seed));
    const data = JSON.parse(saved);
    if (
      !["categories", "levels", "competencies", "skills", "assignments"].every(
        (k) => Array.isArray(data[k]),
      )
    )
      throw Error();
    data.levels = (data.levels as RecordItem[])
      .map((l, i) => (l.order == null ? { ...l, order: i + 1 } : l))
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    return normalize(data);
  } catch {
    return normalize(structuredClone(seed));
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
      ? data.skills.some((x) => inComp(x, id))
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
export function contentMissing(data: Data, work: WorkflowData, a: Assignment): boolean {
  const ci = data.levels.findIndex((l) => l.id === a.current);
  const ei = data.levels.findIndex((l) => l.id === a.expected);
  if (ci >= ei) return false;
  const start = ci < 0 ? 0 : ci + 1;
  return data.levels.slice(start, ei + 1).some(
    (l) => !work.courses.some((c) => c.mappings.some((m) => m.skillId === a.skillId && m.levelId === l.id)),
  );
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
          "Unexpected quote in CSV. Check the file and save it as CSV.",
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
  if (kind === "skills") {
    if (
      !data.competencies.some(
        (x) => x.id === item.competencyId && x.status === "Active",
      )
    )
      errors.push("Choose an active competency.");
  }
  if (item.status === "Inactive" && used(data, kind, item.id))
    errors.push("This item is in use and cannot be deactivated.");
  return errors;
}
