import { AssignmentConfiguration } from "./AssignmentConfiguration";
export { Reports } from "./AdminReports";
import { AssignmentSkills } from "./AssignmentSkills";
import { personKey } from "./managerModel";
import { useEffect, useRef, useState } from "react";
import {
  Plus,
  BookOpen,
  LockKeyhole,
  CheckCircle2,
  Download,
  FileText,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Data, uid, progress, download } from "./model";
import {
  WorkflowData,
  Course,
  Plan,
  Proof,
  requiredCourses,
  matching,
  completeCourse,
  updateCurrent,
} from "./workflowModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
type Props = {
  data: Data;
  work: WorkflowData;
  save: (data: Data, work: WorkflowData, message: string) => boolean;
};
export function CourseMapping({ data, work, save }: Props) {
  const [draft, setDraft] = useState<Course | null>(null),
    [error, setError] = useState("");
  return (
    <section className="cm-card">
      <div className="cm-section-head">
        <div>
          <h2>Skill → course mapping</h2>
          <p>
            Connect each skill level to learning content. Learners follow
            courses in level order.
          </p>
        </div>
        <button
          className="cm-button primary"
          onClick={() => {
            setError("");
            setDraft({
              id: uid(),
              name: "",
              duration: "30 min",
              mappings: [{ skillId: "", levelId: "" }],
            });
          }}
        >
          <Plus size={16} />
          Add course mapping
        </button>
      </div>
      <div className="cm-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Course</th>
              <th>Mapped skills & levels</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {work.courses.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>{c.name}</strong>
                  <small>{c.duration} · Demo course</small>
                </td>
                <td>
                  {c.mappings.map((m) => (
                    <div key={m.skillId}>
                      {data.skills.find((s) => s.id === m.skillId)?.name}{" "}
                      <span className="cm-category">
                        {data.levels.find((l) => l.id === m.levelId)?.name}
                      </span>
                    </div>
                  ))}
                </td>
                <td>
                  <button
                    className="cm-link"
                    onClick={() => {
                      setError("");
                      setDraft(structuredClone(c));
                    }}
                  >
                    Edit mapping
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {draft && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setDraft(null);
          }}
        >
          <DialogContent className="cm-dialog">
            <DialogHeader>
              <DialogTitle>Course mapping</DialogTitle>
              <DialogDescription>
                Map multiple skills to a course, with one level for each skill.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (
                  new Set(draft.mappings.map((m) => m.skillId)).size !==
                  draft.mappings.length
                ) {
                  setError("Each skill can be mapped only once per course.");
                  return;
                }
                if (!draft.name.trim() || !draft.mappings.length) {
                  setError("Add a course name and at least one skill.");
                  return;
                }
                if (
                  work.courses.some(
                    (c) =>
                      c.id !== draft.id &&
                      c.name.toLowerCase() === draft.name.trim().toLowerCase(),
                  )
                ) {
                  setError("A course with this name already exists.");
                  return;
                }
                const old = work.courses.find((c) => c.id === draft.id);
                if (
                  old &&
                  Object.values(work.completed).some((ids) =>
                    ids.includes(draft.id),
                  ) &&
                  JSON.stringify(old.mappings) !==
                    JSON.stringify(draft.mappings)
                ) {
                  setError(
                    "This course has completions. Its skill mappings are locked to preserve learner progress.",
                  );
                  return;
                }
                if (
                  save(
                    data,
                    {
                      ...work,
                      courses: old
                        ? work.courses.map((c) =>
                            c.id === draft.id ? draft : c,
                          )
                        : [
                            ...work.courses,
                            { ...draft, name: draft.name.trim() },
                          ],
                    },
                    "Course mapping saved",
                  )
                )
                  setDraft(null);
              }}
            >
              {error && (
                <p className="cm-error" role="alert">
                  {error}
                </p>
              )}
              <label>
                Course name *
                <input
                  required
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </label>
              <label>
                Duration
                <input
                  value={draft.duration}
                  onChange={(e) =>
                    setDraft({ ...draft, duration: e.target.value })
                  }
                />
              </label>
              {draft.mappings.map((m, i) => (
                <div key={i} className="cm-mapping-row">
                  <label>
                    Skill *
                    <select
                      required
                      value={m.skillId}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          mappings: draft.mappings.map((x, n) =>
                            n === i ? { ...x, skillId: e.target.value } : x,
                          ),
                        })
                      }
                    >
                      <option value="">Select skill</option>
                      {data.skills
                        .filter((s) => s.status === "Active")
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    Level *
                    <select
                      required
                      value={m.levelId}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          mappings: draft.mappings.map((x, n) =>
                            n === i ? { ...x, levelId: e.target.value } : x,
                          ),
                        })
                      }
                    >
                      <option value="">Select level</option>
                      {data.levels
                        .filter((l) => l.status === "Active")
                        .map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="cm-button"
                    aria-label={"Remove mapping " + (i + 1)}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        mappings: draft.mappings.filter((_, n) => n !== i),
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="cm-button"
                onClick={() =>
                  setDraft({
                    ...draft,
                    mappings: [...draft.mappings, { skillId: "", levelId: "" }],
                  })
                }
              >
                + Add skill
              </button>
              <div className="cm-dialog-actions">
                <button
                  className="cm-button"
                  type="button"
                  onClick={() => setDraft(null)}
                >
                  Cancel
                </button>
                <button className="cm-button primary">Save mapping</button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
export function RoleMapping({ data, work, save }: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<Plan | null>(null),
    [step, setStep] = useState(1),
    [error, setError] = useState("");
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [step, error]);
  const today = new Date().toLocaleDateString("en-CA");
  const started = (p: Plan) =>
    data.assignments.some(
      (a) =>
        (p.assignedEmployeeIds && a.employeeId
          ? p.assignedEmployeeIds.includes(a.employeeId)
          : p.assignedNames.includes(a.name)) &&
        p.skills.some((s) => s.skillId === a.skillId) &&
        !!a.current,
    );
  function begin(p?: Plan) {
    setStep(1);
    setError("");
    setDraft(
      p
        ? {
            ...structuredClone(p),
            hasEndDate: !!p.end,
            location: "",
            type: p.method === "Manual" ? "Static" : p.type,
          }
        : {
            id: uid(),
            name: "",
            start: today,
            end: "",
            hasEndDate: false,
            cohort: "",
            method: "Auto",
            type: "Static",
            department: "",
            role: "",
            location: "",
            employeeIds: [],
            skills: [],
            status: "Active",
            assignedNames: [],
          },
    );
  }
  const audience = draft ? matching(work, draft) : [];
  function validate() {
    if (!draft) return false;
    if (
      !draft.name.trim() ||
      !draft.skills.length ||
      draft.skills.some((s) => !s.expected) ||
      !draft.start ||
      (draft.hasEndDate && !draft.end)
    ) {
      setError(
        "Enter a name, select skills and their expected levels, and choose dates.",
      );
      return false;
    }
    if (draft.end && draft.end < draft.start) {
      setError("End date must be on or after start date.");
      return false;
    }
    if (draft.method === "Manual" && !draft.employeeIds.length) {
      setError("Select at least one learner.");
      return false;
    }
    if (
      draft.method === "Auto" &&
      !draft.department &&
      !draft.role &&
      !draft.cohort
    ) {
      setError("Choose at least one audience criterion.");
      return false;
    }
    const old = work.plans.find((p) => p.id === draft.id);
    if (
      old &&
      started(old) &&
      old.skills.some(
        (s) =>
          !draft.skills.some(
            (x) => x.skillId === s.skillId && x.expected === s.expected,
          ),
      )
    ) {
      setError(
        "Learning has started. Existing skill mappings must remain unchanged; you can add more skills.",
      );
      return false;
    }
    setError("");
    return true;
  }
  function assign() {
    if (!draft || !validate()) return;
    const existing = work.plans.some((p) => p.id === draft.id);
    const plan = {
      ...draft,
      name: draft.name.trim(),
      assignedEmployeeIds: audience.map((e) => e.id),
      assignedNames: [
        ...new Set([...draft.assignedNames, ...audience.map((e) => e.name)]),
      ],
    };
    let assignments = [...data.assignments];
    if (plan.start <= today && (!plan.end || plan.end >= today))
      for (const e of audience)
        for (const s of plan.skills) {
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
              assignedDate: new Date().toISOString(),
              name: e.name,
              department: e.department,
              skillId: s.skillId,
              expected: s.expected,
              current: "",
            });
        }
    if (
      save(
        { ...data, assignments },
        {
          ...work,
          plans: existing
            ? work.plans.map((p) => (p.id === plan.id ? plan : p))
            : [...work.plans, plan],
        },
        plan.start > today ? "Assignment scheduled" : "Assignment saved",
      )
    )
      setDraft(null);
  }
  return (
    <section className="cm-card">
      <div className="cm-section-head">
        <div>
          <h2>Competency → role mapping</h2>
          <p>
            Choose required skills, define expectations, and assign them to the
            right people.
          </p>
        </div>
        <button className="cm-button primary" onClick={() => begin()}>
          <Plus size={16} />
          Create assignment
        </button>
      </div>
      <p className="cm-hint">
        Assign skills to selected learners, or use profile rules to enrol
        existing and new users.
      </p>
      {!work.plans.length ? (
        <div className="cm-empty">
          <h3>Give every role a clear growth path</h3>
          <p>
            Start with a competency, then choose skills and your target
            audience.
          </p>
          <button className="cm-button" onClick={() => begin()}>
            Create your first assignment
          </button>
        </div>
      ) : (
        <div className="cm-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Assignment</th>
                <th>Audience</th>
                <th>Skills</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {work.plans.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                    <small>
                      {p.start} → {p.end}
                    </small>
                  </td>
                  <td>
                    {p.method} · {p.type}
                    <small>{p.assignedNames.length} learners</small>
                  </td>
                  <td>{p.skills.length}</td>
                  <td>
                    <span className={"cm-badge " + p.status.toLowerCase()}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <div className="cm-actions">
                      <button className="cm-link" onClick={() => begin(p)}>
                        Edit
                      </button>
                      <button
                        className="cm-link"
                        onClick={() =>
                          begin({
                            ...p,
                            id: uid(),
                            name: p.name + " (copy)",
                            assignedNames: [],
                            employeeIds: [],
                          })
                        }
                      >
                        Duplicate
                      </button>
                      <button
                        className="cm-link"
                        disabled={started(p)}
                        title={
                          started(p)
                            ? "Learning has started; this assignment is protected"
                            : ""
                        }
                        onClick={() =>
                          save(
                            data,
                            {
                              ...work,
                              plans: work.plans.map((x) =>
                                x.id === p.id
                                  ? {
                                      ...x,
                                      status:
                                        x.status === "Active"
                                          ? "Inactive"
                                          : "Active",
                                    }
                                  : x,
                              ),
                            },
                            "Assignment status updated",
                          )
                        }
                      >
                        {p.status === "Active" ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {draft && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setDraft(null);
          }}
        >
          <DialogContent className="cm-dialog cm-wide cm-config-dialog">
            <DialogHeader>
              <DialogTitle>
                {step === 1 ? "Configure assignment" : "Review assignment"}
              </DialogTitle>
              <DialogDescription>
                {step === 1
                  ? "Define the skills and audience. You can review everything before saving."
                  : "Check the learner count, skill requirements, and dates."}
              </DialogDescription>
            </DialogHeader>
            <div className="cm-config-body" ref={bodyRef}>
              {error && (
                <div className="cm-error" role="alert">
                  {error}
                </div>
              )}
              {step === 1 ? (
                <>
                  <AssignmentConfiguration
                    data={data}
                    work={work}
                    draft={draft}
                    onChange={setDraft}
                  />
                  <p className="cm-hint">
                    {audience.length} matching learners · {draft.skills.length}{" "}
                    selected skills
                  </p>
                </>
              ) : (
                <>
                  <h3>{draft.name}</h3>
                  <div className="cm-summary">
                    <p>
                      <strong>{audience.length}</strong> learners ·{" "}
                      <strong>{draft.skills.length}</strong> skills
                    </p>
                    <p>
                      {draft.method} enrolment · {draft.type} audience
                    </p>
                    <p>
                      {draft.start} to {draft.end || "No end date"}
                    </p>
                    <p>
                      {audience
                        .slice(0, 20)
                        .map((e) => e.name)
                        .join(", ") || "No current matching learners"}
                      {audience.length > 20 &&
                        ` and ${audience.length - 20} more learners`}
                    </p>
                  </div>
                  <AssignmentSkills
                    data={data}
                    selected={draft.skills}
                    onChange={() => {}}
                    readOnly
                  />
                  {!audience.length && (
                    <p className="cm-hint">
                      No learners currently match. A static assignment will
                      remain empty; a dynamic assignment can include future
                      matching employees.
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="cm-dialog-actions">
              <button
                className="cm-button"
                onClick={() => (step === 2 ? setStep(1) : setDraft(null))}
              >
                {step === 2 ? "Back" : "Cancel"}
              </button>
              <button
                className="cm-button primary"
                onClick={() =>
                  step === 1 ? validate() && setStep(2) : assign()
                }
              >
                {step === 1 ? "Review assignment" : "Save & assign"}
                <ArrowRight size={16} />
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
export function Learning({
  data,
  work,
  save,
  manager = false,
  learnerKey,
  onLearnerChange,
}: Props & {
  manager?: boolean;
  learnerKey?: string;
  onLearnerChange?: (value: string) => void;
}) {
  const people = [
    ...new Map(data.assignments.map((a) => [personKey(a), a])).entries(),
  ];
  const [localKey, setLocalKey] = useState(""),
    [submission, setSubmission] = useState<{
      assignmentId: string;
      courseId: string;
    } | null>(null),
    [file, setFile] = useState<File | null>(null),
    [remark, setRemark] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const requestedKey = learnerKey ?? localKey;
  const selectedKey = people.some(([id]) => id === requestedKey)
    ? requestedKey
    : people[0]?.[0] || "";
  const assignments = data.assignments.filter(
    (a) => personKey(a) === selectedKey,
  );
  function finish(assignmentId: string, courseId: string) {
    const next = completeCourse(data, work, assignmentId, courseId);
    save(next.data, next.work, "Course completed. Skill progress updated.");
  }
  async function submit() {
    if (!file || !submission) return;
    setError("");
    if (
      file.size > 1024 * 1024 ||
      !["application/pdf", "image/png", "image/jpeg"].includes(file.type)
    ) {
      setError("Use a PDF, PNG or JPEG file under 1 MB for this prototype.");
      return;
    }
    setBusy(true);
    try {
      const document = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const proof: Proof = {
        id: uid(),
        ...submission,
        levelId: work.courses
          .find((c) => c.id === submission.courseId)
          ?.mappings.find(
            (m) =>
              m.skillId ===
              data.assignments.find((a) => a.id === submission.assignmentId)
                ?.skillId,
          )?.levelId,
        fileName: file.name,
        document,
        status: "Under Review",
        remarks: "",
        submitted: new Date().toISOString().slice(0, 10),
      };
      if (
        save(
          data,
          { ...work, proofs: [...work.proofs, proof] },
          "Proof submitted for review",
        )
      ) {
        setSubmission(null);
        setFile(null);
      }
    } catch {
      setError("Unable to read this file. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  function review(p: Proof, approved: boolean) {
    if (!approved && !remark[p.id]?.trim()) {
      toast.error("Add a reason so the learner knows what to do next.");
      return;
    }
    const updated = {
      ...work,
      proofs: work.proofs.map((x) =>
        x.id === p.id
          ? {
              ...x,
              status: approved ? ("Approved" as const) : ("Rejected" as const),
              remarks: remark[p.id]?.trim() || "",
            }
          : x,
      ),
    };
    const next = approved
      ? completeCourse(data, updated, p.assignmentId, p.courseId)
      : { data, work: updated };
    save(
      next.data,
      next.work,
      approved
        ? "Proof approved. Course completed."
        : "Proof rejected with feedback.",
    );
  }
  return (
    <section className="cm-card">
      <div className="cm-section-head">
        <div>
          <h2>
            {manager ? "Team skill progress" : "My skills & learning plan"}
          </h2>
          <p>
            {manager
              ? "Review evidence and help reportees close their skill gaps."
              : "See your next step, complete courses in order, and track your growth."}
          </p>
        </div>
        <select
          aria-label={manager ? "Select reportee" : "Preview learner"}
          value={selectedKey}
          onChange={(e) => (onLearnerChange || setLocalKey)(e.target.value)}
        >
          {people.map(([id, a]) => (
            <option key={id} value={id}>
              {a.name} · {a.department}
            </option>
          ))}
        </select>
      </div>
      <p className="cm-hint">
        {manager
          ? "Manager preview · All demo employees are shown. Production access must be limited to authorized reportees."
          : "Learner preview · Course completion is simulated in this prototype."}
      </p>
      {assignments.map((a) => {
        const courses = requiredCourses(data, work, a);
        const done = work.completed[a.id] || [];
        const first = courses.find((c) => !done.includes(c.id));
        const currentIndex = data.levels.findIndex((l) => l.id === a.current);
        const expectedIndex = data.levels.findIndex((l) => l.id === a.expected);
        return (
          <article className="cm-learning-card" key={a.id}>
            <div className="cm-section-head">
              <div>
                <h3>{data.skills.find((s) => s.id === a.skillId)?.name}</h3>
                <p>
                  {data.levels.find((l) => l.id === a.current)?.name ||
                    "Current level not recorded"}{" "}
                  → {data.levels.find((l) => l.id === a.expected)?.name}
                </p>
              </div>
              <span
                className={
                  "cm-badge " +
                  (progress(data, a) === "Completed" ? "active" : "draft")
                }
              >
                {progress(data, a)}
                {a.updatedBy ? " · Updated by " + a.updatedBy : ""}
              </span>
            </div>
            <div className="cm-level-track">
              {data.levels.map((l, i) => (
                <div
                  key={l.id}
                  className={
                    i <= currentIndex
                      ? "done"
                      : i > expectedIndex
                        ? "beyond"
                        : ""
                  }
                >
                  <span>
                    {i <= currentIndex ? <CheckCircle2 size={17} /> : i + 1}
                  </span>
                  <strong>{l.name}</strong>
                  <small>
                    {
                      data.skills.find((s) => s.id === a.skillId)?.levels?.[
                        l.id
                      ]
                    }
                  </small>
                </div>
              ))}
            </div>
            {manager && (
              <label className="cm-manager-level">
                Update current level
                <select
                  aria-label={"Manager current level for " + a.skillId}
                  value={a.current}
                  onChange={(e) => {
                    const next = updateCurrent(
                      data,
                      work,
                      a.id,
                      e.target.value,
                      "Manager",
                    );
                    save(
                      next.data,
                      next.work,
                      "Current level updated by manager",
                    );
                  }}
                >
                  <option value="">Not recorded</option>
                  {data.levels.slice(0, expectedIndex + 1).map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {!a.current && (
              <p className="cm-hint">
                Your administrator or manager needs to record your current level
                before your learning plan can be generated.
              </p>
            )}
            {a.current &&
              currentIndex < expectedIndex &&
              data.levels
                .slice(currentIndex + 1, expectedIndex + 1)
                .some(
                  (l) =>
                    !work.courses.some((c) =>
                      c.mappings.some(
                        (m) => m.skillId === a.skillId && m.levelId === l.id,
                      ),
                    ),
                ) && (
                <p className="cm-hint">
                  Some required levels do not have courses yet. Your
                  administrator can add them under Course mapping.
                </p>
              )}
            {courses.map((c) => {
              const proof = work.proofs
                .filter((p) => p.assignmentId === a.id && p.courseId === c.id)
                .at(-1);
              const hasEarlierGap = data.levels
                .slice(
                  currentIndex + 1,
                  data.levels.findIndex((l) => l.id === c.level.id),
                )
                .some(
                  (l) =>
                    !work.courses.some((course) =>
                      course.mappings.some(
                        (m) => m.skillId === a.skillId && m.levelId === l.id,
                      ),
                    ),
                );
              const locked = c.id !== first?.id || hasEarlierGap;
              return (
                <div className="cm-course-row" key={c.id}>
                  <BookOpen size={21} />
                  <div>
                    <strong>{c.name}</strong>
                    <small>
                      {c.level.name} · {c.duration}
                    </small>
                    {proof && (
                      <small>
                        {proof.status}
                        {proof.remarks ? " · " + proof.remarks : ""}
                      </small>
                    )}
                  </div>
                  {done.includes(c.id) ? (
                    <span className="cm-badge active">Completed</span>
                  ) : (
                    <div className="cm-actions">
                      <button
                        className="cm-button"
                        disabled={locked || proof?.status === "Under Review"}
                        title={locked ? "Complete prior levels first" : ""}
                        onClick={() => finish(a.id, c.id)}
                      >
                        {locked ? (
                          <>
                            <LockKeyhole size={14} />
                            Locked
                          </>
                        ) : (
                          "Complete demo course"
                        )}
                      </button>
                      <button
                        className="cm-text-button"
                        disabled={locked || proof?.status === "Under Review"}
                        onClick={() => {
                          setError("");
                          setFile(null);
                          setSubmission({ assignmentId: a.id, courseId: c.id });
                        }}
                      >
                        Submit proof
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </article>
        );
      })}
      {manager && (
        <>
          <h3>Proof submissions</h3>
          {!work.proofs.length && (
            <p>
              No submissions yet. Learners can submit a certificate from their
              learning plan.
            </p>
          )}
          {work.proofs
            .filter((p) => assignments.some((a) => a.id === p.assignmentId))
            .map((p) => (
              <div key={p.id} className="cm-learning-card">
                <div className="cm-section-head">
                  <div>
                    <strong>
                      {work.courses.find((c) => c.id === p.courseId)?.name}
                    </strong>
                    <p>
                      {p.submitted} · {p.fileName}
                    </p>
                  </div>
                  <span className="cm-badge">{p.status}</span>
                </div>
                <a className="cm-link" href={p.document} download={p.fileName}>
                  <FileText size={16} />
                  Download submitted proof
                </a>
                {p.status === "Under Review" ? (
                  <>
                    <label>
                      Review remarks
                      <textarea
                        value={remark[p.id] || ""}
                        onChange={(e) =>
                          setRemark({ ...remark, [p.id]: e.target.value })
                        }
                        placeholder="Required when rejecting evidence"
                      />
                    </label>
                    <div className="cm-actions">
                      <button
                        className="cm-button"
                        onClick={() => review(p, false)}
                      >
                        Reject with feedback
                      </button>
                      <button
                        className="cm-button primary"
                        onClick={() => review(p, true)}
                      >
                        Approve proof
                      </button>
                    </div>
                  </>
                ) : (
                  <p>{p.remarks || "Review complete"}</p>
                )}
              </div>
            ))}
        </>
      )}
      {submission && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open && !busy) setSubmission(null);
          }}
        >
          <DialogContent className="cm-dialog">
            <DialogHeader>
              <DialogTitle>Submit proof of completion</DialogTitle>
              <DialogDescription>
                Upload a certificate or supporting document for your manager to
                review.
              </DialogDescription>
            </DialogHeader>
            <label>
              Certificate or document
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            <p className="cm-hint">
              PDF, PNG or JPEG · Up to 1 MB. Stored in this browser for the
              prototype.
            </p>
            {error && (
              <p className="cm-error" role="alert">
                {error}
              </p>
            )}
            <div className="cm-dialog-actions">
              <button
                className="cm-button"
                disabled={busy}
                onClick={() => setSubmission(null)}
              >
                Cancel
              </button>
              <button
                className="cm-button primary"
                disabled={!file || busy}
                onClick={() => void submit()}
              >
                {busy ? "Saving…" : "Submit for review"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
