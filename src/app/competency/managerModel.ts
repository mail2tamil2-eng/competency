import { Assignment, Data, progress } from "./model";
import { Proof, WorkflowData } from "./workflowModel";

export const personKey = (a: Assignment) =>
  a.employeeId || JSON.stringify([a.name, a.department]);
export function employeeFor(work: WorkflowData, a: Assignment) {
  if (a.employeeId) return work.employees.find((e) => e.id === a.employeeId);
  const matches = work.employees.filter(
    (e) => e.name === a.name && e.department === a.department,
  );
  return matches.length === 1 ? matches[0] : undefined;
}
export const levelName = (data: Data, id: string) =>
  data.levels.find((l) => l.id === id)?.name || "Not assessed";
export function skillGap(data: Data, a: Assignment) {
  const current = data.levels.findIndex((l) => l.id === a.current);
  const expected = data.levels.findIndex((l) => l.id === a.expected);
  return current < 0 || expected < 0 ? null : Math.max(0, expected - current);
}
export function latestProofs(work: WorkflowData, assignmentId: string) {
  const latest = new Map<string, Proof>();
  for (const proof of work.proofs.filter(
    (p) => p.assignmentId === assignmentId,
  ))
    latest.set(proof.courseId, proof);
  return [...latest.values()];
}
export function proofStatus(work: WorkflowData, id: string) {
  const proofs = latestProofs(work, id);
  return proofs.some((p) => p.status === "Under Review")
    ? "Under Review"
    : proofs.some((p) => p.status === "Rejected")
      ? "Rejected"
      : proofs.length
        ? "Approved"
        : "No submission";
}
export function managerLevel(
  data: Data,
  a: Assignment,
  level: string,
  reason: string,
  at = new Date().toISOString(),
) {
  if (!data.levels.some((l) => l.id === level && l.status === "Active"))
    throw Error("Choose an active proficiency level.");
  if (
    data.levels.findIndex((l) => l.id === level) <=
    data.levels.findIndex((l) => l.id === a.current)
  )
    throw Error("Choose a level higher than the current level.");
  if (!reason.trim()) throw Error("Add a reason for this level change.");
  const next = {
    ...a,
    current: level,
    updatedBy: "Manager" as const,
    levelHistory: [
      ...(a.levelHistory || []),
      { from: a.current, to: level, at, by: "Manager", reason: reason.trim() },
    ],
  };
  next.completedDate =
    progress(data, next) === "Completed" ? a.completedDate || at : undefined;
  return {
    ...data,
    assignments: data.assignments.map((x) => (x.id === a.id ? next : x)),
  };
}
export function reviewProof(
  data: Data,
  work: WorkflowData,
  id: string,
  approved: boolean,
  reason: string,
) {
  const proof = work.proofs.find((p) => p.id === id);
  const a = data.assignments.find((a) => a.id === proof?.assignmentId);
  if (
    !proof ||
    !a ||
    proof.status !== "Under Review" ||
    !latestProofs(work, a.id).some((p) => p.id === id)
  )
    throw Error("This submission is no longer awaiting review.");
  if (!approved && !reason.trim())
    throw Error("Add a reason so the learner knows what to do next.");
  const course = work.courses.find((c) => c.id === proof.courseId);
  const level =
    proof.levelId ||
    course?.mappings.find((m) => m.skillId === a.skillId)?.levelId;
  if (
    approved &&
    (!level ||
      !data.levels.some((l) => l.id === level && l.status === "Active"))
  )
    throw Error(
      "The mapped skill level is unavailable. Ask the administrator to restore the mapping.",
    );
  const at = new Date().toISOString();
  let nextData = data;
  if (
    approved &&
    data.levels.findIndex((l) => l.id === level) >
      data.levels.findIndex((l) => l.id === a.current)
  ) {
    nextData = managerLevel(
      data,
      a,
      level!,
      `Proof approved: ${course?.name || "Course"}${reason.trim() ? ". " + reason.trim() : ""}`,
      at,
    );
  }
  return {
    data: nextData,
    work: {
      ...work,
      completed: approved
        ? {
            ...work.completed,
            [a.id]: [
              ...new Set([...(work.completed[a.id] || []), proof.courseId]),
            ],
          }
        : work.completed,
      proofs: work.proofs.map((p) =>
        p.id === id
          ? {
              ...p,
              status: approved ? ("Approved" as const) : ("Rejected" as const),
              remarks: reason.trim(),
              reviewedAt: at,
              reviewedBy: "Manager",
            }
          : p,
      ),
    },
  };
}
export function detailedRows(
  data: Data,
  work: WorkflowData,
  assignments: Assignment[],
) {
  return assignments.map((a) => {
    const skill = data.skills.find((s) => s.id === a.skillId);
    return [
      a.name,
      employeeFor(work, a)?.email || "Not recorded",
      a.department,
      data.competencies.find((c) => c.id === skill?.competencyId)?.name ||
        "Unavailable",
      skill?.name || "Unavailable",
      levelName(data, a.current),
      levelName(data, a.expected),
      skillGap(data, a) ?? "Not assessed",
      proofStatus(work, a.id),
      progress(data, a),
      a.assignedDate || "Not recorded",
      a.completedDate || "Not recorded",
    ];
  });
}
export const detailedHeaders = [
  "Reportee",
  "Email ID",
  "Department",
  "Competency",
  "Skill",
  "Current level",
  "Expected level",
  "Skill gap (levels)",
  "Proof submission",
  "Status",
  "Assigned date",
  "Completed date",
];
export async function exportWorkbook(rows: (string | number)[][]) {
  const { default: ExcelJS } = await import("exceljs");
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("Team Skill Progress", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.addRow(detailedHeaders);
  sheet.addRows(rows);
  sheet.columns.forEach((column, i) => {
    column.width = [24, 32, 20, 25, 28, 20, 20, 20, 22, 20, 28, 28][i];
  });
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F46E5" },
  };
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: rows.length + 1, column: detailedHeaders.length },
  };
  const buffer = await book.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([new Uint8Array(buffer)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "team-skill-progress-detailed.xlsx";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
