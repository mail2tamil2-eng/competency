import { Data, RecordItem, parseCSV, uid, validate, inComp } from "./model";
export type LibraryImportRow = {
  line: number;
  competency: string;
  skill: string;
  action: string;
  errors: string[];
};
export type LibraryImport = {
  rows: LibraryImportRow[];
  competencies: RecordItem[];
  skills: RecordItem[];
};
export function libraryHeaders(data: Data) {
  return [
    "Competency",
    "Competency Description",
    "Skill",
    "Skill Description",
    ...data.levels
      .filter((l) => l.status === "Active")
      .map((l) => l.name + " Description"),
  ];
}
export function libraryRows(data: Data, competencies: RecordItem[]) {
  return competencies.flatMap((c) => {
    const skills = data.skills.filter((s) => inComp(s, c.id));
    return (skills.length ? skills : [undefined]).map((s) => [
      c.name,
      c.description,
      s?.name || "",
      s?.description || "",
      ...data.levels
        .filter((l) => l.status === "Active")
        .map((l) => s?.levels?.[l.id] || ""),
    ]);
  });
}
/** Filled-in sample: one new competency with two skills. */
export function librarySample(data: Data): string[][] {
  const levels = data.levels.filter((l) => l.status === "Active");
  const row = (comp: string, compDesc: string, skill: string, skillDesc: string) => [
    comp, compDesc, skill, skillDesc, ...levels.map((l) => `${skill} at ${l.name} level.`),
  ];
  return [
    libraryHeaders(data),
    row("Customer Focus", "Understand and meet customer needs.", "Handling Complaints", "Resolve complaints calmly and quickly."),
    row("Customer Focus", "", "Customer Empathy", "See problems from the customer's side."),
  ];
}
export function prepareLibraryImport(text: string, data: Data): LibraryImport {
  const parsed = parseCSV(text);
  if (parsed.length < 2)
    throw Error("Add at least one row below the column headings.");
  if (parsed.length > 1001) throw Error("Upload up to 1,000 rows at a time.");
  const columns = parsed[0].map((h) => h.toLowerCase());
  if (new Set(columns).size !== columns.length)
    throw Error("Remove duplicate column headings.");
  // Only Competency is required; missing optional columns are read as blank.
  if (!columns.includes("competency"))
    throw Error("The Competency column is mandatory.");
  const competencies: RecordItem[] = [],
    skills: RecordItem[] = [],
    rows: LibraryImportRow[] = [];
  const names = new Set(data.skills.map((s) => s.name.toLowerCase()));
  for (const [i, cells] of parsed.slice(1).entries()) {
    const get = (h: string) => cells[columns.indexOf(h.toLowerCase())] || "";
    const errors: string[] = [];
    if (cells.length !== columns.length)
      errors.push("Column count does not match the header.");
    const name = get("Competency"),
      skillName = get("Skill");
    if (!name) errors.push("Competency name is required.");
    if (name.length > 120)
      errors.push("Competency name must be 120 characters or fewer.");
    let competency = [...data.competencies, ...competencies].find(
      (c) => c.name.toLowerCase() === name.toLowerCase(),
    );
    const isNew = !competency;
    if (competency) {
      if (competency.status !== "Active")
        errors.push("Activate this competency before adding skills.");
      if (
        get("Competency Description") &&
        competency.description &&
        get("Competency Description") !== competency.description
      )
        errors.push(
          "Competency description conflicts with an existing or earlier row. Leave it blank to keep the description.",
        );
      if (
        !competency.description &&
        get("Competency Description") &&
        competencies.includes(competency)
      )
        competency.description = get("Competency Description");
    } else {
      competency = {
        id: uid(),
        name,
        description: get("Competency Description"),
        status: "Active",
      };
      competencies.push(competency);
    }
    if (skillName) {
      const skill: RecordItem = {
        id: uid(),
        name: skillName,
        description: get("Skill Description"),
        competencyId: competency.id,
        status: "Active",
        levels: Object.fromEntries(
          data.levels
            .filter((l) => l.status === "Active")
            .map((l) => [l.id, get(l.name + " Description")]),
        ),
      };
      errors.push(
        ...validate(skill, "skills", {
          ...data,
          competencies: [...data.competencies, ...competencies],
        }).filter((e) => e !== "This name already exists."),
      );
      if (names.has(skillName.toLowerCase()))
        errors.push(
          "This skill name already exists in the library or this file. Imports add new skills; edit existing skills in the library.",
        );
      names.add(skillName.toLowerCase());
      skills.push(skill);
    } else if (!isNew) {
      errors.push(
        "This competency already exists. Add a new skill on this row.",
      );
    }
    rows.push({
      line: i + 2,
      competency: name,
      skill: skillName,
      action: isNew
        ? skillName
          ? "New competency + skill"
          : "New competency"
        : "Add skill to competency",
      errors: [...new Set(errors)],
    });
  }
  return { rows, competencies, skills };
}
