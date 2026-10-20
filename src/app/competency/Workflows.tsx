import { AssignmentConfiguration } from "./AssignmentConfiguration";
export { Reports } from "./AdminReports";
import { AssignmentSkills } from "./AssignmentSkills";
import { personKey } from "./managerModel";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  Plus,
  BookOpen,
  LockKeyhole,
  CheckCircle2,
  Download,
  FileText,
  ArrowRight,
  Pencil,
  Copy,
  Trash2,
  Ban,
  Layers,
  AlertTriangle,
  Target,
  ChevronRight,
  Route,
} from "lucide-react";
import { toast } from "sonner";
import { Data, uid, progress, contentMissing, download } from "./model";
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
    [mappingComps, setMappingComps] = useState<string[]>([]),
    [error, setError] = useState("");

  function openDraft(c?: Course) {
    setError("");
    if (c) {
      setDraft(structuredClone(c));
      setMappingComps(
        c.mappings.map(
          (m) => data.skills.find((s) => s.id === m.skillId)?.competencyId || "",
        ),
      );
    } else {
      setDraft({ id: uid(), name: "", duration: "", mappings: [{ skillId: "", levelId: "" }] });
      setMappingComps([""]);
    }
  }

  function updateComp(i: number, compId: string, currentSkillId: string) {
    const newComps = mappingComps.map((c, n) => (n === i ? compId : c));
    setMappingComps(newComps);
    const skillStillValid = compId === "" || data.skills.find((s) => s.id === currentSkillId)?.competencyId === compId;
    if (!skillStillValid && draft) {
      setDraft({
        ...draft,
        mappings: draft.mappings.map((x, n) => (n === i ? { ...x, skillId: "" } : x)),
      });
    }
  }

  function updateSkill(i: number, skillId: string) {
    if (!draft) return;
    const comp = data.skills.find((s) => s.id === skillId)?.competencyId || "";
    setMappingComps(mappingComps.map((c, n) => (n === i ? comp : c)));
    setDraft({
      ...draft,
      mappings: draft.mappings.map((x, n) => (n === i ? { ...x, skillId } : x)),
    });
  }

  const activeComps = data.competencies.filter((c) => c.status === "Active");

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
        <button className="cm-button primary" onClick={() => openDraft()}>
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
              <th style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {work.courses.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>{c.name}</strong>
                  <small>Demo course</small>
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
                  <div className="cm-row-actions">
                    <button
                      className="cm-icon-button"
                      title="Edit mapping"
                      aria-label={"Edit mapping for " + c.name}
                      onClick={() => openDraft(c)}
                    >
                      <Pencil size={15} />
                    </button>
                  </div>
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
                <span className="cm-req-label">Course name <span className="req">*</span></span>
                <input
                  required
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </label>
              {draft.mappings.map((m, i) => (
                <div key={i} className="cm-mapping-row">
                  <label>
                    Competency
                    <select
                      value={mappingComps[i] || ""}
                      onChange={(e) => updateComp(i, e.target.value, m.skillId)}
                    >
                      <option value="">All competencies</option>
                      {activeComps.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="cm-req-label">Skill <span className="req">*</span></span>
                    <select
                      required
                      value={m.skillId}
                      onChange={(e) => updateSkill(i, e.target.value)}
                    >
                      <option value="">Select skill</option>
                      {data.skills
                        .filter(
                          (s) =>
                            s.status === "Active" &&
                            (!mappingComps[i] || s.competencyId === mappingComps[i]),
                        )
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    <span className="cm-req-label">Level <span className="req">*</span></span>
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
                    className="cm-icon-button danger"
                    title="Remove"
                    aria-label={"Remove mapping " + (i + 1)}
                    style={{ marginBottom: "17px" }}
                    onClick={() => {
                      setDraft({
                        ...draft,
                        mappings: draft.mappings.filter((_, n) => n !== i),
                      });
                      setMappingComps(mappingComps.filter((_, n) => n !== i));
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="cm-text-button"
                style={{ alignSelf: "flex-start", marginTop: 4 }}
                onClick={() => {
                  setDraft({
                    ...draft,
                    mappings: [...draft.mappings, { skillId: "", levelId: "" }],
                  });
                  setMappingComps([...mappingComps, ""]);
                }}
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
  const formRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<Plan | null>(null),
    [error, setError] = useState(""),
    [inactivatingPlan, setInactivatingPlan] = useState<Plan | null>(null),
    [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);
  useEffect(() => {
    if (error) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [error]);
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
  const planIsProtected = (p: Plan) =>
    data.assignments.some(
      (a) =>
        (p.assignedEmployeeIds && a.employeeId
          ? p.assignedEmployeeIds.includes(a.employeeId)
          : p.assignedNames.includes(a.name)) &&
        p.skills.some((s) => s.skillId === a.skillId),
    );
  function begin(p?: Plan) {
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
            departments: [],
            roles: [],
            cohorts: [],
          },
    );
  }
  const audience = draft ? matching(work, draft) : [];

  function validate() {
    if (!draft) return false;
    if (!draft.name.trim() || !draft.skills.length || draft.skills.some((s) => !s.expected) || !draft.start || (draft.hasEndDate && !draft.end)) {
      setError("Enter a name, select skills and their expected levels, and choose dates.");
      return false;
    }
    if (draft.end && draft.end < draft.start) { setError("End date must be on or after start date."); return false; }
    if (draft.method === "Manual" && !draft.employeeIds.length) { setError("Select at least one learner."); return false; }
    if (draft.method === "Auto" && !draft.department && !draft.role && !draft.cohort && !draft.departments?.length && !draft.roles?.length && !draft.cohorts?.length) {
      setError("Choose at least one audience criterion (department, role, or cohort)."); return false;
    }
    const old = work.plans.find((p) => p.id === draft.id);
    if (old && started(old) && old.skills.some((s) => !draft.skills.some((x) => x.skillId === s.skillId && x.expected === s.expected))) {
      setError("Learning has started. Existing skill mappings must remain unchanged; you can add more skills."); return false;
    }
    setError(""); return true;
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
  if (draft) return (
    <section className="cm-inline-form" ref={formRef}>
      <div className="cm-inline-form-head">
        <button type="button" className="cm-text-button cm-inline-back" onClick={() => setDraft(null)}>
          ← Assignments
        </button>
        <h2>{draft.name.trim() || "New assignment"}</h2>
        <p className="cm-inline-form-meta">
          {audience.length} matching learner{audience.length !== 1 ? "s" : ""} · {draft.skills.length} skill{draft.skills.length !== 1 ? "s" : ""}
        </p>
      </div>
      {error && <div className="cm-error" role="alert">{error}</div>}
      <AssignmentConfiguration data={data} work={work} draft={draft} onChange={setDraft} />
      <div className="cm-inline-form-actions">
        <button className="cm-button" onClick={() => setDraft(null)}>Cancel</button>
        <button className="cm-button primary" onClick={assign}>Save &amp; assign</button>
      </div>
    </section>
  );

  return (
    <section className="cm-card">
      <div className="cm-section-head">
        <div>
          <h2>Competency → role mapping</h2>
          <p>Choose required skills, define expectations, and assign them to the right people.</p>
        </div>
        <button className="cm-button primary" onClick={() => begin()}>
          <Plus size={16} />
          Create assignment
        </button>
      </div>
      {!work.plans.length ? (
        <div className="cm-empty">
          <h3>Give every role a clear growth path</h3>
          <p>Start with a competency, then choose skills and your target audience.</p>
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
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {work.plans.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                    <small>{p.start} → {p.end}</small>
                  </td>
                  <td>
                    {p.method} · {p.type}
                    <small>{p.assignedNames.length} learners</small>
                  </td>
                  <td>{p.skills.length}</td>
                  <td>
                    <span className={"cm-badge " + p.status.toLowerCase()}>{p.status}</span>
                  </td>
                  <td>
                    <div className="cm-row-actions">
                      <button className="cm-icon-button" title="Edit" aria-label={"Edit " + p.name} onClick={() => begin(p)}>
                        <Pencil size={15} />
                      </button>
                      <button className="cm-icon-button" title="Duplicate" aria-label={"Duplicate " + p.name}
                        onClick={() => begin({ ...p, id: uid(), name: p.name + " (copy)", assignedNames: [], employeeIds: [] })}>
                        <Copy size={15} />
                      </button>
                      {p.status === "Active" && (
                        <button className="cm-icon-button" title="Inactivate" aria-label={"Inactivate " + p.name}
                          onClick={() => setInactivatingPlan(p)}>
                          <Ban size={15} />
                        </button>
                      )}
                      <button className="cm-icon-button danger" title="Delete" aria-label={"Delete " + p.name}
                        onClick={() => setDeletingPlan(p)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Inactivate assignment confirmation */}
      {inactivatingPlan && (
        <Dialog open onOpenChange={(open) => { if (!open) setInactivatingPlan(null); }}>
          <DialogContent className="cm-dialog">
            <DialogHeader>
              <DialogTitle>Are you sure you want to inactivate {inactivatingPlan.name}?</DialogTitle>
              <DialogDescription>
                The assignment will no longer apply to new users or trigger new learning assignments.
              </DialogDescription>
            </DialogHeader>
            <div className="cm-dialog-actions">
              <button className="cm-button" onClick={() => setInactivatingPlan(null)}>Cancel</button>
              <button
                className="cm-button destructive"
                onClick={() => {
                  save(
                    data,
                    { ...work, plans: work.plans.map((x) => x.id === inactivatingPlan.id ? { ...x, status: "Inactive" } : x) },
                    "Assignment inactivated",
                  );
                  setInactivatingPlan(null);
                }}
              >
                Inactivate
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete assignment confirmation */}
      {deletingPlan && (
        <Dialog open onOpenChange={(open) => { if (!open) setDeletingPlan(null); }}>
          <DialogContent className="cm-dialog">
            <DialogHeader>
              <DialogTitle>
                {planIsProtected(deletingPlan)
                  ? `${deletingPlan.name} is assigned to learners or progress exists, so it cannot be deleted.`
                  : `Are you sure you want to delete ${deletingPlan.name}?`}
              </DialogTitle>
              {!planIsProtected(deletingPlan) && (
                <DialogDescription>
                  This will permanently remove the skill-to-role assignment.
                </DialogDescription>
              )}
            </DialogHeader>
            <div className="cm-dialog-actions">
              <button className="cm-button" onClick={() => setDeletingPlan(null)}>Cancel</button>
              {!planIsProtected(deletingPlan) && (
                <button
                  className="cm-button destructive"
                  onClick={() => {
                    save(
                      data,
                      { ...work, plans: work.plans.filter((x) => x.id !== deletingPlan.id) },
                      "Assignment deleted",
                    );
                    setDeletingPlan(null);
                  }}
                >
                  Delete
                </button>
              )}
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
    [skillView, setSkillView] = useState<"skill" | "competency">("skill"),
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
    <section className={`cm-card${!manager ? " cm-learner" : ""}`}>
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

      {/* My Skill Widget — learner only */}
      {!manager && assignments.length > 0 && (() => {
        const achieved = assignments.filter((a) => progress(data, a) === "Completed").length;
        const inProgress = assignments.filter((a) => progress(data, a) === "In Progress").length;
        const notStarted = assignments.filter((a) => progress(data, a) === "Yet to Start").length;
        const needsAttention = assignments.filter((a) => progress(data, a) !== "Completed" && contentMissing(data, work, a)).length;
        const pct = assignments.length ? Math.round((achieved / assignments.length) * 100) : 0;
        return (
          <div className="cm-skill-widget">
            <div className="cm-skill-widget-stat">
              <strong>{assignments.length}</strong>
              <span>Assigned skills</span>
            </div>
            <div className="cm-skill-widget-stat success">
              <strong>{achieved}</strong>
              <span>Achieved</span>
            </div>
            <div className="cm-skill-widget-stat pending">
              <strong>{inProgress}</strong>
              <span>In Progress</span>
            </div>
            <div className="cm-skill-widget-stat muted">
              <strong>{notStarted}</strong>
              <span>Not Started</span>
            </div>
            {needsAttention > 0 && (
              <div className="cm-skill-widget-stat warn">
                <strong>{needsAttention}</strong>
                <span>Needs Attention</span>
              </div>
            )}
            <div className="cm-skill-widget-progress">
              <span>Overall progress</span>
              <div className="cm-skill-widget-bar">
                <div style={{ width: pct + "%" }} />
              </div>
              <strong>{pct}%</strong>
            </div>
          </div>
        );
      })()}

      {/* View toggle — learner only */}
      {!manager && assignments.length > 0 && (
        <div className="cm-view-toggle" role="group" aria-label="View mode">
          <button
            className={skillView === "skill" ? "active" : ""}
            aria-pressed={skillView === "skill"}
            onClick={() => setSkillView("skill")}
          >
            <Target size={15} /> Skill view
          </button>
          <button
            className={skillView === "competency" ? "active" : ""}
            aria-pressed={skillView === "competency"}
            onClick={() => setSkillView("competency")}
          >
            <Layers size={15} /> Competency view
          </button>
        </div>
      )}

      {/* Career progression — learner only, rich card design */}
      {!manager && (() => {
        const firstA = assignments[0];
        if (!firstA) return null;
        const emp = work.employees.find(
          (e) => e.id === firstA.employeeId || (e.name === firstA.name && e.department === firstA.department),
        );
        if (!emp?.role) return null;
        const matchingPaths = (work.careerPaths ?? []).filter(
          (cp) => cp.status === "Active" && cp.roles.includes(emp.role),
        );
        if (matchingPaths.length === 0) return null;
        const completedCount = assignments.filter((a) => progress(data, a) === "Completed").length;
        const pct = assignments.length ? Math.round((completedCount / assignments.length) * 100) : 0;
        const circumference = 2 * Math.PI * 26;
        // Group current-role assignments by competency
        const byComp = new Map<string, typeof assignments>();
        for (const a of assignments) {
          const cId = data.skills.find((s) => s.id === a.skillId)?.competencyId || "__none__";
          if (!byComp.has(cId)) byComp.set(cId, []);
          byComp.get(cId)!.push(a);
        }
        return (
          <div className="cm-lp-career">
            {matchingPaths.map((cp) => {
              const roleIdx = cp.roles.indexOf(emp.role);
              const isLast = roleIdx === cp.roles.length - 1;
              const nextRole = isLast ? null : cp.roles[roleIdx + 1];
              const threshold = isLast ? null : cp.thresholds[roleIdx];
              const meetsThreshold = threshold !== null && pct >= threshold!;
              const nextRolePlans = nextRole
                ? work.plans.filter((p) => p.status === "Active" && (p.roles?.includes(nextRole) || p.role === nextRole))
                : [];
              const nextRoleSkillIds = [...new Set(nextRolePlans.flatMap((p) => p.skills.map((s) => s.skillId)))];
              const mySkillIds = new Set(assignments.map((a) => a.skillId));
              const phase1Status = completedCount === assignments.length ? "Complete" : pct > 0 ? "In Progress" : "Not Started";
              const inProgressCount = assignments.filter((a) => progress(data, a) === "In Progress").length;
              const notStartedCount = assignments.filter((a) => progress(data, a) === "Yet to Start").length;
              const firstActiveSkill = assignments.find((a) => progress(data, a) === "In Progress")
                ?? assignments.find((a) => progress(data, a) === "Yet to Start");
              return (
                <div key={cp.id} className="cm-lp-panel">
                  {/* Header */}
                  <div className="cm-lp-panel-head">
                    <Route size={17} className="cm-lp-panel-icon" />
                    <div>
                      <strong>My Career Path</strong>
                      <span>Track your journey toward your next role, skills and goals.</span>
                    </div>
                  </div>

                  {/* Hero: Current Role | Donut | Next Role */}
                  <div className="cm-lp-hero">
                    <div className="cm-lp-hero-role">
                      <span className="cm-lp-hero-role-label">Current Role</span>
                      <span className="cm-lp-hero-role-chip current">{emp.role}</span>
                    </div>
                    <div className="cm-lp-hero-donut">
                      <svg viewBox="0 0 64 64" aria-hidden="true">
                        <circle cx="32" cy="32" r="26" fill="none" stroke="#dce8ff" strokeWidth="7" />
                        {pct > 0 && (
                          <circle
                            cx="32" cy="32" r="26" fill="none"
                            stroke={meetsThreshold ? "#1ca85e" : "#2463d6"}
                            strokeWidth="7"
                            strokeDasharray={`${circumference * pct / 100} ${circumference}`}
                            strokeLinecap="round"
                            transform="rotate(-90 32 32)"
                          />
                        )}
                        <text x="32" y="37" textAnchor="middle" className="cm-lp-donut-txt">{pct}%</text>
                      </svg>
                      <span>Role Competency Progress</span>
                    </div>
                    {!isLast ? (
                      <div className="cm-lp-hero-role">
                        <span className="cm-lp-hero-role-label">Next Role</span>
                        <span className={`cm-lp-hero-role-chip next${meetsThreshold ? " ready" : ""}`}>{nextRole}</span>
                      </div>
                    ) : (
                      <div className="cm-lp-hero-role">
                        <span className="cm-lp-hero-role-label">Status</span>
                        <span className="cm-lp-hero-role-chip next ready">Top of path</span>
                      </div>
                    )}
                  </div>

                  <div className="cm-lp-body-grid">
                  <div className="cm-lp-main">
                  {/* Career path chain */}
                  <div className="cm-lp-chain-wrap">
                    <div className="cm-lp-chain-label">{cp.name}</div>
                    <div className="cm-cp-chain">
                      {cp.roles.map((role, i) => (
                        <Fragment key={i}>
                          <div className={`cm-cp-role${i < roleIdx ? " past" : i === roleIdx ? " current" : " future"}`}>
                            <span className="cm-cp-role-num">
                              {i < roleIdx ? <CheckCircle2 size={10} /> : i + 1}
                            </span>
                            <span className="cm-cp-role-name">{role}</span>
                          </div>
                          {i < cp.roles.length - 1 && (
                            <div className="cm-cp-connector" aria-hidden="true">
                              <ChevronRight size={13} className="cm-cp-arrow" />
                              <span className="cm-cp-pct">{cp.thresholds[i]}%</span>
                            </div>
                          )}
                        </Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Phase 1 — current role skills grouped by competency */}
                  <div className="cm-lp-phase">
                    <div className="cm-lp-phase-head">
                      <span className="cm-lp-phase-num">Phase {roleIdx + 1}</span>
                      <div>
                        <strong>{emp.role} · Current Role Skills</strong>
                        <span>{completedCount} of {assignments.length} skills completed</span>
                      </div>
                      <span className={`cm-badge${phase1Status === "Complete" ? " active" : phase1Status === "In Progress" ? " draft" : ""}`}>
                        {phase1Status}
                      </span>
                    </div>
                    <div className="cm-lp-phase-bar-wrap">
                      <div className="cm-lp-phase-bar">
                        <div style={{ width: pct + "%" }} className={pct === 100 ? "done" : ""} />
                      </div>
                      <span>{pct}%</span>
                    </div>
                    {[...byComp.entries()].map(([cId, items]) => {
                      const comp = data.competencies.find((c) => c.id === cId);
                      return (
                        <div key={cId} className="cm-lp-comp-group">
                          {comp && <div className="cm-lp-comp-name">{comp.name}</div>}
                          {items.map((a) => {
                            const skill = data.skills.find((s) => s.id === a.skillId);
                            if (!skill) return null;
                            const cIdx = data.levels.findIndex((l) => l.id === a.current);
                            const eIdx = data.levels.findIndex((l) => l.id === a.expected);
                            const skillPct = !a.current ? 0 : cIdx >= eIdx ? 100 : Math.round((cIdx + 1) / (eIdx + 1) * 100);
                            const st = progress(data, a);
                            return (
                              <div key={a.id} className="cm-lp-skill-row">
                                <span className="cm-lp-skill-name">{skill.name}</span>
                                <div className="cm-lp-skill-bar-wrap">
                                  <div className="cm-lp-skill-bar">
                                    <div style={{ width: skillPct + "%" }} className={st === "Completed" ? "done" : ""} />
                                  </div>
                                  <span className="cm-lp-skill-pct">{skillPct}%</span>
                                </div>
                                <span className={`cm-badge sm ${st === "Completed" ? "active" : st === "In Progress" ? "draft" : ""}`}>{st}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>

                  {/* Phase 2 — next role skills */}
                  {nextRole && (
                    <div className={`cm-lp-phase${!meetsThreshold ? " locked" : ""}`}>
                      <div className="cm-lp-phase-head">
                        <span className="cm-lp-phase-num">{roleIdx + 2}</span>
                        <div>
                          <strong>{nextRole} · Next Role Skills</strong>
                          <span>
                            {meetsThreshold
                              ? "You've met the threshold — start preparing for your next role"
                              : `Reach ${threshold}% in your current role to unlock`}
                          </span>
                        </div>
                        {meetsThreshold ? (
                          <span className="cm-badge active">Unlocked</span>
                        ) : (
                          <span className="cm-badge">Locked</span>
                        )}
                      </div>
                      {!meetsThreshold && (
                        <div className="cm-lp-locked">
                          <LockKeyhole size={18} />
                          <span>Complete {threshold! - pct}% more of your current role to unlock next-role preparation</span>
                        </div>
                      )}
                      {meetsThreshold && nextRoleSkillIds.length > 0 && (
                        <div className="cm-lp-comp-group">
                          {nextRoleSkillIds.map((skillId) => {
                            const skill = data.skills.find((s) => s.id === skillId);
                            if (!skill) return null;
                            const assignment = assignments.find((a) => a.skillId === skillId);
                            const st = assignment ? progress(data, assignment) : "Not yet assigned";
                            const cIdx = assignment ? data.levels.findIndex((l) => l.id === assignment.current) : -1;
                            const eIdx = assignment ? data.levels.findIndex((l) => l.id === assignment.expected) : -1;
                            const skillPct = !assignment?.current ? 0 : cIdx >= eIdx ? 100 : Math.round((cIdx + 1) / (eIdx + 1) * 100);
                            return (
                              <div key={skillId} className="cm-lp-skill-row">
                                <span className="cm-lp-skill-name">{skill.name}</span>
                                <div className="cm-lp-skill-bar-wrap">
                                  <div className="cm-lp-skill-bar">
                                    <div style={{ width: skillPct + "%" }} className={st === "Completed" ? "done" : ""} />
                                  </div>
                                  <span className="cm-lp-skill-pct">{skillPct}%</span>
                                </div>
                                <span className={`cm-badge sm ${st === "Completed" ? "active" : mySkillIds.has(skillId) ? "draft" : ""}`}>
                                  {st === "Completed" ? "Achieved" : st}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {meetsThreshold && nextRoleSkillIds.length === 0 && (
                        <p className="cm-hint" style={{ marginTop: 10 }}>
                          No skills assigned for {nextRole} yet. Contact your administrator.
                        </p>
                      )}
                    </div>
                  )}
                  </div>{/* /cm-lp-main */}
                  <aside className="cm-lp-sidebar">
                    <div className="cm-lp-sidebar-card">
                      <div className="cm-lp-sidebar-title">Progress Summary</div>
                      <div className="cm-lp-stats">
                        <div className="cm-lp-stat cm-lp-stat--green">
                          <span className="cm-lp-stat-num">{completedCount}</span>
                          <span className="cm-lp-stat-label">Done</span>
                        </div>
                        <div className="cm-lp-stat cm-lp-stat--blue">
                          <span className="cm-lp-stat-num">{inProgressCount}</span>
                          <span className="cm-lp-stat-label">Active</span>
                        </div>
                        <div className="cm-lp-stat cm-lp-stat--gray">
                          <span className="cm-lp-stat-num">{notStartedCount}</span>
                          <span className="cm-lp-stat-label">Pending</span>
                        </div>
                      </div>
                    </div>
                    {threshold !== null && (
                      <div className="cm-lp-sidebar-card">
                        <div className="cm-lp-sidebar-title">Next Role Unlock</div>
                        <div className="cm-lp-unlock-bar">
                          <div style={{ width: Math.min(100, threshold ? Math.round(pct / threshold * 100) : 0) + "%" }} className={meetsThreshold ? "done" : ""} />
                        </div>
                        <div className="cm-lp-unlock-meta">
                          <span>{pct}% complete</span>
                          <span>Target {threshold}%</span>
                        </div>
                        {meetsThreshold ? (
                          <div className="cm-lp-unlock-ready"><CheckCircle2 size={14} /> Ready for {nextRole}</div>
                        ) : (
                          <div className="cm-lp-unlock-hint">{threshold! - pct}% more to unlock {nextRole}</div>
                        )}
                      </div>
                    )}
                    {firstActiveSkill && (
                      <div className="cm-lp-sidebar-card">
                        <div className="cm-lp-sidebar-title">Focus Next</div>
                        <div className="cm-lp-focus">
                          <span className="cm-lp-focus-verb">{progress(data, firstActiveSkill) === "In Progress" ? "Continue" : "Start"}</span>
                          <strong className="cm-lp-focus-skill">{data.skills.find((s) => s.id === firstActiveSkill.skillId)?.name}</strong>
                        </div>
                      </div>
                    )}
                  </aside>
                  </div>{/* /cm-lp-body-grid */}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Competency view — grouped by competency */}
      {!manager && skillView === "competency" && (() => {
        const grouped = new Map<string, typeof assignments>();
        for (const a of assignments) {
          const skill = data.skills.find((s) => s.id === a.skillId);
          const cId = skill?.competencyId || "__none__";
          if (!grouped.has(cId)) grouped.set(cId, []);
          grouped.get(cId)!.push(a);
        }
        return (
          <div className="cm-competency-view">
            {[...grouped.entries()].map(([cId, items]) => {
              const comp = data.competencies.find((c) => c.id === cId);
              const done = items.filter((a) => progress(data, a) === "Completed").length;
              const ip = items.filter((a) => progress(data, a) === "In Progress").length;
              const pct = items.length ? Math.round((done / items.length) * 100) : 0;
              const compStatus = done === items.length ? "Completed" : ip > 0 ? "In Progress" : "Not Started";
              return (
                <div key={cId} className="cm-competency-group">
                  <div className="cm-competency-group-header">
                    <div>
                      <strong>{comp?.name || "Uncategorised"}</strong>
                      <span className="cm-category">{items.length} skill{items.length !== 1 ? "s" : ""}</span>
                      <span className={`cm-badge ${compStatus === "Completed" ? "active" : compStatus === "In Progress" ? "draft" : ""}`}>
                        {compStatus}
                      </span>
                    </div>
                    <div className="cm-competency-group-progress">
                      <progress max={100} value={pct} aria-label={`${comp?.name} progress`} />
                      <span>{pct}%</span>
                    </div>
                  </div>
                  <div className="cm-competency-skills">
                    {items.map((a) => {
                      const skill = data.skills.find((s) => s.id === a.skillId);
                      const st = progress(data, a);
                      const gap = data.levels.findIndex((l) => l.id === a.expected) - data.levels.findIndex((l) => l.id === a.current);
                      const missing = contentMissing(data, work, a);
                      return (
                        <div key={a.id} className="cm-competency-skill-row">
                          <span><strong>{skill?.name}</strong></span>
                          <span className="cm-skill-progress-detail">
                            {a.current ? data.levels.find((l) => l.id === a.current)?.name : "Not assessed"}
                            {" → "}
                            {data.levels.find((l) => l.id === a.expected)?.name}
                            {missing && <span className="cm-content-missing"><AlertTriangle size={12} /> Content missing</span>}
                          </span>
                          <span className={`cm-badge ${st === "Completed" ? "active" : st === "In Progress" ? "draft" : ""}`}>{st}</span>
                          {st !== "Completed" && gap > 0 && <span className="cm-gap-chip">{gap} level{gap !== 1 ? "s" : ""} to go</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {(manager || skillView === "skill") && assignments.map((a) => {
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
                    "Not assessed"}{" "}
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
              <p className="cm-hint cm-not-assessed">
                Not Assessed — your administrator or manager needs to record your current level before your learning plan can be generated.
              </p>
            )}
            {a.current &&
              currentIndex < expectedIndex && (() => {
                const missingLevels = data.levels
                  .slice(currentIndex + 1, expectedIndex + 1)
                  .filter((l) => !work.courses.some((c) => c.mappings.some((m) => m.skillId === a.skillId && m.levelId === l.id)));
                if (!missingLevels.length) return null;
                const skillName = data.skills.find((s) => s.id === a.skillId)?.name || "this skill";
                const compName = data.competencies.find((c) => c.id === data.skills.find((s) => s.id === a.skillId)?.competencyId)?.name || "";
                return (
                  <p className="cm-hint cm-content-missing-hint">
                    <AlertTriangle size={14} />
                    {" "}Learning Unavailable — required learning for {skillName} ({missingLevels.map((l) => l.name).join(", ")}) under {compName} has not been configured. Please contact your administrator.
                  </p>
                );
              })()}
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
