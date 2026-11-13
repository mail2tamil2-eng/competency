import { Data, RecordItem, parseCSV, uid } from "./model";
import { Course } from "./workflowModel";
import { listJoin } from "./BulkUploadParts";

export const requiredSkillColumns = ["Skill Name", "Level Name", "Course ID"];

/* Skill Master bulk upload: one row per skill per proficiency level. */
export const skillHeaders = [
  "Skill Name",
  "Skill Description",
  "Level Name",
  "Level Description",
  "Course ID",
];

export type SkillImportRow = {
  line: number;
  skill: string;
  level: string;
  courses: string[];
  errors: string[];
};
export type SkillImport = {
  rows: SkillImportRow[];
  skills: RecordItem[];
  /** courseId → new mappings to add */
  mappings: { courseId: string; skillId: string; levelId: string }[];
};

const activeLevels = (data: Data) =>
  data.levels
    .filter((l) => l.status === "Active")
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

/** Template rows: Level Name is pre-filled (system generated) for every active level. */
export function skillTemplate(data: Data): string[][] {
  const levels = activeLevels(data);
  const example = (name: string, desc: string) =>
    levels.map((l, i) => [name, i === 0 ? desc : "", l.name, "", ""]);
  return [skillHeaders, ...example("Example Skill", "Optional skill description")];
}

/** Filled-in sample: two example skills, one row per active level, with real Course IDs. */
export function skillSample(data: Data, courses: Course[]): string[][] {
  const levels = activeLevels(data);
  const ids = courses.map((c) => c.id);
  const course = (i: number) => (ids.length ? ids[i % ids.length] : "");
  const example = (name: string, desc: string, offset: number) =>
    levels.map((l, i) => [
      name,
      i === 0 ? desc : "",
      l.name,
      `${name} at ${l.name} level.`,
      // Several courses can go on one level, separated by ;
      i === 0 && ids.length > 1 ? `${course(offset)};${course(offset + 1)}` : course(offset + i),
    ]);
  return [
    skillHeaders,
    ...example("Negotiation", "Reach agreements that work for both sides.", 0),
    ...example("Time Management", "Plan and prioritise work to meet deadlines.", 2),
  ];
}

export function courseList(courses: Course[]): string[][] {
  return [["Course ID", "Course Name", "Duration"], ...courses.map((c) => [c.id, c.name, c.duration])];
}

/** Course IDs may be separated by ; or | so several courses can map to one level. */
const splitIds = (v: string) =>
  v.split(/[;|]/).map((x) => x.trim()).filter(Boolean);

export function prepareSkillImport(text: string, data: Data, courses: Course[]): SkillImport {
  const parsed = parseCSV(text);
  if (parsed.length < 2) throw Error("Add at least one row below the column headings.");
  if (parsed.length > 5001) throw Error("Upload up to 5,000 rows at a time.");
  const columns = parsed[0].map((h) => h.trim().toLowerCase());
  if (new Set(columns).size !== columns.length) throw Error("Remove duplicate column headings.");
  // Skill Name, Level Name and Course ID are mandatory; descriptions are optional.
  const missingCols = requiredSkillColumns.filter((h) => !columns.includes(h.toLowerCase()));
  if (missingCols.length)
    throw Error(`${listJoin(requiredSkillColumns)} columns are mandatory. Missing: ${missingCols.join(", ")}.`);

  const levels = activeLevels(data);
  const existing = new Set(data.skills.map((s) => s.name.trim().toLowerCase()));
  const rows: SkillImportRow[] = [];
  const bySkill = new Map<string, { skill: RecordItem; rows: SkillImportRow[]; levelIds: Set<string> }>();
  const mappings: SkillImport["mappings"] = [];

  for (const [i, cells] of parsed.slice(1).entries()) {
    const get = (h: string) => (cells[columns.indexOf(h.toLowerCase())] || "").trim();
    const errors: string[] = [];
    const name = get("Skill Name"),
      desc = get("Skill Description"),
      levelName = get("Level Name"),
      levelDesc = get("Level Description"),
      courseIds = splitIds(get("Course ID"));
    if (cells.length > columns.length) errors.push("Row has more columns than the header.");
    if (!name) errors.push("Skill Name is required.");
    if (name.length > 120) errors.push("Skill Name must be 120 characters or fewer.");
    if (name && existing.has(name.toLowerCase()))
      errors.push("This skill already exists in Skill Master. Bulk upload only adds new skills.");
    const level = levels.find((l) => l.name.toLowerCase() === levelName.toLowerCase());
    if (!levelName) errors.push("Level Name is required.");
    else if (!level) errors.push(`"${levelName}" is not an active proficiency level.`);
    if (!courseIds.length) errors.push("Course ID is required.");
    for (const id of courseIds)
      if (!courses.some((c) => c.id.toLowerCase() === id.toLowerCase()))
        errors.push(`Course ID "${id}" was not found.`);

    const row: SkillImportRow = { line: i + 2, skill: name, level: level?.name || levelName, courses: courseIds, errors };
    rows.push(row);
    if (!name) continue;

    const k = name.toLowerCase();
    let group = bySkill.get(k);
    if (!group) {
      group = {
        skill: { id: uid(), name, description: desc, status: "Active", levels: {} },
        rows: [],
        levelIds: new Set(),
      };
      bySkill.set(k, group);
    } else if (desc && group.skill.description && desc !== group.skill.description) {
      errors.push("Skill Description differs from an earlier row for this skill. Enter it once or keep it the same.");
    } else if (desc && !group.skill.description) group.skill.description = desc;
    group.rows.push(row);

    if (level) {
      if (group.levelIds.has(level.id)) errors.push(`${level.name} is listed more than once for this skill.`);
      group.levelIds.add(level.id);
      group.skill.levels![level.id] = levelDesc;
      for (const id of courseIds) {
        const course = courses.find((c) => c.id.toLowerCase() === id.toLowerCase());
        if (course && !mappings.some((m) => m.courseId === course.id && m.skillId === group!.skill.id && m.levelId === level.id))
          mappings.push({ courseId: course.id, skillId: group.skill.id, levelId: level.id });
      }
    }
  }

  // A skill uploaded with rows for only some levels uses just those levels.
  for (const g of bySkill.values())
    if (g.levelIds.size) {
      // Levels run in order up to the highest level provided.
      const top = Math.max(...levels.map((l, i) => (g.levelIds.has(l.id) ? i : -1)));
      if (top < levels.length - 1) g.skill.levelIds = levels.slice(0, top + 1).map((l) => l.id);
    }
  for (const r of rows) r.errors = [...new Set(r.errors)];

  return { rows, skills: [...bySkill.values()].map((g) => g.skill), mappings };
}
