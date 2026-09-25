import { Data, Assignment, uid } from "./model";
export type Course = {
  id: string;
  name: string;
  duration: string;
  mappings: { skillId: string; levelId: string; weightage?: number }[];
};
export type Employee = {
  id: string;
  cohort?: string;
  email?: string;
  managerId?: string;
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
  hasEndDate?: boolean;
  cohort?: string;
  assignedEmployeeIds?: string[];
  method: "Manual" | "Auto";
  type: "Static" | "Dynamic";
  department: string;
  role: string;
  location: string;
  employeeIds: string[];
  skills: { skillId: string; expected: string }[];
  status: "Active" | "Inactive";
  assignedNames: string[];
  departments?: string[];
  roles?: string[];
  cohorts?: string[];
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
  reviewedAt?: string;
  reviewedBy?: string;
  levelId?: string;
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
    { id: "e1",  email: "ananya.r@example.com",   name: "Ananya R.",    department: "Sales",          role: "Executive",        location: "Chennai",   cohort: "Batch 2024-A" },
    { id: "e2",  email: "rahul.k@example.com",    name: "Rahul K.",     department: "Customer Support", role: "Team Lead",       location: "Bengaluru", cohort: "Batch 2024-B" },
    { id: "e3",  email: "meera.s@example.com",    name: "Meera S.",     department: "Sales",          role: "Manager",          location: "Mumbai",    cohort: "Batch 2024-A" },
    { id: "e4",  email: "priya.n@example.com",    name: "Priya N.",     department: "Engineering",    role: "Engineer",         location: "Chennai",   cohort: "New Joiners 2025" },
    { id: "e5",  email: "arjun.v@example.com",    name: "Arjun V.",     department: "Customer Support", role: "Executive",      location: "Chennai",   cohort: "Batch 2024-B" },
    { id: "e6",  email: "divya.m@example.com",    name: "Divya M.",     department: "Engineering",    role: "Team Lead",        location: "Bengaluru", cohort: "New Joiners 2025" },
    { id: "e7",  email: "karthik.p@example.com",  name: "Karthik P.",   department: "Sales",          role: "Executive",        location: "Mumbai",    cohort: "Batch 2024-A" },
    { id: "e8",  email: "sudha.r@example.com",    name: "Sudha R.",     department: "HR",             role: "Manager",          location: "Chennai",   cohort: "Leadership 2025" },
    { id: "e9",  email: "vikram.t@example.com",   name: "Vikram T.",    department: "Finance",        role: "Analyst",          location: "Chennai",   cohort: "Batch 2024-B" },
    { id: "e10", email: "nithya.k@example.com",   name: "Nithya K.",    department: "Marketing",      role: "Specialist",       location: "Mumbai",    cohort: "Batch 2024-A" },
    { id: "e11", email: "arun.b@example.com",     name: "Arun B.",      department: "Operations",     role: "Coordinator",      location: "Chennai",   cohort: "New Joiners 2025" },
    { id: "e12", email: "kavitha.r@example.com",  name: "Kavitha R.",   department: "Product",        role: "Senior Analyst",   location: "Bengaluru", cohort: "Lateral Hires 2025" },
    { id: "e13", email: "siva.m@example.com",     name: "Siva M.",      department: "Engineering",    role: "Senior Engineer",  location: "Chennai",   cohort: "Batch 2023-A" },
    { id: "e14", email: "pooja.v@example.com",    name: "Pooja V.",     department: "Design",         role: "Specialist",       location: "Mumbai",    cohort: "New Joiners 2025" },
    { id: "e15", email: "mani.s@example.com",     name: "Mani S.",      department: "Legal",          role: "Consultant",       location: "Chennai",   cohort: "Lateral Hires 2025" },
    { id: "e16", email: "deepa.n@example.com",    name: "Deepa N.",     department: "Finance",        role: "Senior Analyst",   location: "Bengaluru", cohort: "Batch 2024-A" },
    { id: "e17", email: "raj.k@example.com",      name: "Raj K.",       department: "Procurement",    role: "Coordinator",      location: "Chennai",   cohort: "Batch 2023-A" },
    { id: "e18", email: "sangeetha.p@example.com",name: "Sangeetha P.", department: "HR",             role: "Specialist",       location: "Mumbai",    cohort: "Batch 2024-B" },
    { id: "e19", email: "ganesh.r@example.com",   name: "Ganesh R.",    department: "Marketing",      role: "Team Lead",        location: "Chennai",   cohort: "Leadership 2025" },
    { id: "e20", email: "lakshmi.v@example.com",  name: "Lakshmi V.",   department: "Product",        role: "Manager",          location: "Bengaluru", cohort: "Leadership 2025" },
    { id: "e21", email: "selvam.k@example.com",   name: "Selvam K.",    department: "Operations",     role: "Team Lead",        location: "Chennai",   cohort: "Batch 2024-B" },
    { id: "e22", email: "revathi.m@example.com",  name: "Revathi M.",   department: "Design",         role: "Senior Analyst",   location: "Mumbai",    cohort: "Lateral Hires 2025" },
    { id: "e23", email: "bala.s@example.com",     name: "Bala S.",      department: "Engineering",    role: "Engineer",         location: "Chennai",   cohort: "New Joiners 2025" },
    { id: "e24", email: "nisha.t@example.com",    name: "Nisha T.",     department: "Sales",          role: "Senior Analyst",   location: "Bengaluru", cohort: "Batch 2023-A" },
    { id: "e25", email: "prasad.v@example.com",   name: "Prasad V.",    department: "Legal",          role: "Manager",          location: "Chennai",   cohort: "Lateral Hires 2025" },
    { id: "e26", email: "usha.r@example.com",     name: "Usha R.",      department: "Admin",          role: "Coordinator",      location: "Mumbai",    cohort: "Batch 2024-A" },
    { id: "e27", email: "karthi.m@example.com",   name: "Karthi M.",    department: "Customer Support", role: "Analyst",        location: "Chennai",   cohort: "Batch 2023-A" },
    { id: "e28", email: "janani.k@example.com",   name: "Janani K.",    department: "Procurement",    role: "Senior Analyst",   location: "Bengaluru", cohort: "Batch 2024-B" },
    { id: "e29", email: "suresh.b@example.com",   name: "Suresh B.",    department: "Finance",        role: "Team Lead",        location: "Chennai",   cohort: "Leadership 2025" },
    { id: "e30", email: "amala.p@example.com",    name: "Amala P.",     department: "Admin",          role: "Executive",        location: "Mumbai",    cohort: "New Joiners 2025" },
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
  const selected = new Set(p.employeeIds);
  return work.employees.filter((e) => {
    if (p.method === "Manual") return selected.has(e.id);
    const deptOk = p.departments?.length
      ? p.departments.includes(e.department)
      : !p.department || p.department === e.department;
    const roleOk = p.roles?.length
      ? p.roles.includes(e.role)
      : !p.role || p.role === e.role;
    const cohortOk = p.cohorts?.length
      ? p.cohorts.includes(e.cohort || "")
      : !p.cohort || p.cohort === e.cohort;
    return deptOk && roleOk && cohortOk && (!p.location || p.location === e.location);
  });
}
export function applyPlans(data: Data, work: WorkflowData, today: string) {
  const assignments = [...data.assignments];
  const plans = work.plans.map((p) => {
    if (p.status !== "Active" || p.start > today || (p.end && p.end < today))
      return p;
    const learners = matching(work, p).filter(
      (e) =>
        p.type === "Dynamic" ||
        (p.assignedEmployeeIds
          ? p.assignedEmployeeIds.includes(e.id)
          : p.assignedNames.includes(e.name)),
    );
    for (const e of learners)
      for (const s of p.skills) {
        const existing = assignments.find(
          (a) =>
            (a.employeeId
              ? a.employeeId === e.id
              : a.name === e.name && a.department === e.department) &&
            a.skillId === s.skillId,
        );
        if (existing) {
          if (
            data.levels.findIndex((l) => l.id === s.expected) >
            data.levels.findIndex((l) => l.id === existing.expected)
          )
            assignments[assignments.indexOf(existing)] = {
              ...existing,
              expected: s.expected,
              completedDate: undefined,
            };
        } else
          assignments.push({
            id: uid(),
            employeeId: e.id,
            assignedDate: today,
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
        x.id === a.id
          ? {
              ...x,
              current: data.levels[current]?.id || "",
              completedDate:
                current >= expected
                  ? x.completedDate || new Date().toISOString()
                  : undefined,
            }
          : x,
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
        x.id === a.id
          ? {
              ...x,
              current: levelId,
              updatedBy: by,
              completedDate:
                rank >= data.levels.findIndex((l) => l.id === a.expected)
                  ? x.completedDate || new Date().toISOString()
                  : undefined,
            }
          : x,
      ),
    },
    work: {
      ...work,
      completed: { ...work.completed, [a.id]: courses.map((c) => c.id) },
    },
  };
}
