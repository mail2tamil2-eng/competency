import { Data, Assignment, uid } from "./model";
export type Course = {
  id: string;
  name: string;
  duration: string;
  mappings: { skillId: string; levelId: string }[];
};
export type Employee = {
  id: string;
  name: string;
  department: string;
  role: string;
  location: string;
};
export type Plan = {
  id: string;
  name: string;
  start: string;
  end: string;
  method: "Manual" | "Auto";
  type: "Static" | "Dynamic";
  department: string;
  role: string;
  location: string;
  employeeIds: string[];
  skills: { skillId: string; expected: string }[];
  status: "Active" | "Inactive";
  assignedNames: string[];
};
export type Proof = {
  id: string;
  assignmentId: string;
  courseId: string;
  fileName: string;
  document: string;
  status: "Under Review" | "Approved" | "Rejected";
  remarks: string;
  submitted: string;
};
export type WorkflowData = {
  courses: Course[];
  employees: Employee[];
  plans: Plan[];
  proofs: Proof[];
  completed: Record<string, string[]>;
  settings: { admin: boolean; learner: boolean; manager: boolean };
};
export const workflowKey = "axle-competency-workflows-v1";
export const workflowSeed: WorkflowData = {
  courses: [
    {
      id: "c1",
      name: "Listening with Intent",
      duration: "25 min",
      mappings: [{ skillId: "listening", levelId: "l1" }],
    },
    {
      id: "c2",
      name: "Understanding Different Perspectives",
      duration: "40 min",
      mappings: [{ skillId: "listening", levelId: "l2" }],
    },
    {
      id: "c3",
      name: "Coaching Active Listening",
      duration: "35 min",
      mappings: [{ skillId: "listening", levelId: "l3" }],
    },
    {
      id: "c4",
      name: "Presentation Essentials",
      duration: "30 min",
      mappings: [{ skillId: "speaking", levelId: "l0" }],
    },
    {
      id: "c5",
      name: "Confident Public Speaking",
      duration: "45 min",
      mappings: [{ skillId: "speaking", levelId: "l1" }],
    },
    {
      id: "c6",
      name: "Engaging Your Audience",
      duration: "50 min",
      mappings: [{ skillId: "speaking", levelId: "l2" }],
    },
  ],
  employees: [
    {
      id: "e1",
      name: "Ananya R.",
      department: "Sales",
      role: "Executive",
      location: "Chennai",
    },
    {
      id: "e2",
      name: "Rahul K.",
      department: "Support",
      role: "Team Lead",
      location: "Bengaluru",
    },
    {
      id: "e3",
      name: "Meera S.",
      department: "Sales",
      role: "Manager",
      location: "Mumbai",
    },
  ],
  plans: [],
  proofs: [],
  completed: {},
  settings: { admin: true, learner: true, manager: true },
};
export function readWorkflows(): WorkflowData {
  try {
    const raw = localStorage.getItem(workflowKey);
    if (!raw) return structuredClone(workflowSeed);
    const x = JSON.parse(raw);
    if (
      !Array.isArray(x.courses) ||
      !Array.isArray(x.employees) ||
      !Array.isArray(x.plans) ||
      !Array.isArray(x.proofs)
    )
      throw Error();
    return { ...structuredClone(workflowSeed), ...x };
  } catch {
    return structuredClone(workflowSeed);
  }
}
export function requiredCourses(data: Data, work: WorkflowData, a: Assignment) {
  if (!a.current) return [];
  const current = data.levels.findIndex((l) => l.id === a.current),
    expected = data.levels.findIndex((l) => l.id === a.expected);
  return data.levels
    .slice(current + 1, expected + 1)
    .flatMap((l) =>
      work.courses
        .filter((c) =>
          c.mappings.some((m) => m.skillId === a.skillId && m.levelId === l.id),
        )
        .map((c) => ({ ...c, level: l })),
    );
}
export function matching(work: WorkflowData, p: Plan) {
  return work.employees.filter((e) =>
    p.method === "Manual"
      ? p.employeeIds.includes(e.id)
      : (!p.department || p.department === e.department) &&
        (!p.role || p.role === e.role) &&
        (!p.location || p.location === e.location),
  );
}
export function applyPlans(data: Data, work: WorkflowData, today: string) {
  const assignments = [...data.assignments];
  const plans = work.plans.map((p) => {
    if (p.status !== "Active" || p.start > today || p.end < today) return p;
    const learners = matching(work, p).filter(
      (e) => p.type === "Dynamic" || p.assignedNames.includes(e.name),
    );
    for (const e of learners)
      for (const s of p.skills) {
        const existing = assignments.find(
          (a) => a.name === e.name && a.skillId === s.skillId,
        );
        if (existing) {
          if (
            data.levels.findIndex((l) => l.id === s.expected) >
            data.levels.findIndex((l) => l.id === existing.expected)
          )
            assignments[assignments.indexOf(existing)] = {
              ...existing,
              expected: s.expected,
            };
        } else
          assignments.push({
            id: uid(),
            name: e.name,
            department: e.department,
            skillId: s.skillId,
            expected: s.expected,
            current: "",
          });
      }
    return {
      ...p,
      assignedNames: [
        ...new Set([...p.assignedNames, ...learners.map((e) => e.name)]),
      ],
    };
  });
  return { data: { ...data, assignments }, work: { ...work, plans } };
}
export function completeCourse(
  data: Data,
  work: WorkflowData,
  assignmentId: string,
  courseId: string,
) {
  const a = data.assignments.find((x) => x.id === assignmentId);
  if (!a) return { data, work };
  const completed = {
    ...work.completed,
    [a.id]: [...new Set([...(work.completed[a.id] || []), courseId])],
  };
  let current = data.levels.findIndex((l) => l.id === a.current);
  const expected = data.levels.findIndex((l) => l.id === a.expected);
  while (current < expected) {
    const level = data.levels[current + 1];
    const courses = work.courses.filter((c) =>
      c.mappings.some((m) => m.skillId === a.skillId && m.levelId === level.id),
    );
    if (
      !courses.length ||
      !courses.every((c) => completed[a.id].includes(c.id))
    )
      break;
    current++;
  }
  return {
    data: {
      ...data,
      assignments: data.assignments.map((x) =>
        x.id === a.id ? { ...x, current: data.levels[current]?.id || "" } : x,
      ),
    },
    work: { ...work, completed },
  };
}

export function updateCurrent(
  data: Data,
  work: WorkflowData,
  assignmentId: string,
  levelId: string,
  by: "Admin" | "Manager",
) {
  const a = data.assignments.find((x) => x.id === assignmentId);
  if (!a) return { data, work };
  const rank = data.levels.findIndex((l) => l.id === levelId);
  const courses = work.courses.filter((c) =>
    c.mappings.some(
      (m) =>
        m.skillId === a.skillId &&
        data.levels.findIndex((l) => l.id === m.levelId) <= rank,
    ),
  );
  return {
    data: {
      ...data,
      assignments: data.assignments.map((x) =>
        x.id === a.id ? { ...x, current: levelId, updatedBy: by } : x,
      ),
    },
    work: {
      ...work,
      completed: { ...work.completed, [a.id]: courses.map((c) => c.id) },
    },
  };
}
