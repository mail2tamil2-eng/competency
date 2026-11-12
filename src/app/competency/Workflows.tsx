import { statusText } from "./displayText";
﻿import { AssignmentConfiguration } from "./AssignmentConfiguration";
export { Reports } from "./AdminReports";
import { AssignmentSkills } from "./AssignmentSkills";
import { DisclosureIcon } from "./Disclosure";
import { personKey } from "./managerModel";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  Plus,
  BookOpen,
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
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Data, uid, progress, contentMissing, download, compIdsOf, inComp, compNames, assignmentLevels } from "./model";
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
          (m) => compIdsOf(data.skills.find((s) => s.id === m.skillId))[0] || "",
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
    const skillStillValid = compId === "" || inComp(data.skills.find((s) => s.id === currentSkillId), compId);
    if (!skillStillValid && draft) {
      setDraft({
        ...draft,
        mappings: draft.mappings.map((x, n) => (n === i ? { ...x, skillId: "" } : x)),
      });
    }
  }

  function updateSkill(i: number, skillId: string) {
    if (!draft) return;
    const ids = compIdsOf(data.skills.find((s) => s.id === skillId));
    // Keep the chosen competency when the skill belongs to it; otherwise use the skill's first one.
    const comp = mappingComps[i] && ids.includes(mappingComps[i]) ? mappingComps[i] : ids[0] || "";
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
          <h2>Skill → Course Mapping</h2>
          <p>
            Connect each skill level to learning content. Learners follow
            courses in level order.
          </p>
        </div>
        <button className="cm-button primary" onClick={() => openDraft()}>
          <Plus size={16} />
          Add Course Mapping
        </button>
      </div>
      <div className="cm-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Course</th>
              <th>Mapped Skills & Levels</th>
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
                      title="Edit Mapping"
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
              <DialogTitle>Course Mapping</DialogTitle>
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
                <span className="cm-req-label">Course Name <span className="req">*</span></span>
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
                      <option value="">All Competencies</option>
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
                      <option value="">Select Skill</option>
                      {data.skills
                        .filter(
                          (s) =>
                            s.status === "Active" &&
                            (!mappingComps[i] || inComp(s, mappingComps[i])),
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
                      <option value="">Select Level</option>
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
                + Add Skill
              </button>
              <div className="cm-dialog-actions">
                <button
                  className="cm-button"
                  type="button"
                  onClick={() => setDraft(null)}
                >
                  Cancel
                </button>
                <button className="cm-button primary">Save Mapping</button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
export function RoleMapping({
  data,
  work,
  save,
  initialSkills,
}: Props & { initialSkills?: { skillId: string; expected: string }[] }) {
  const formRef = useRef<HTMLDivElement>(null);
  const today = new Date().toLocaleDateString("en-CA");
  const blankDraft = (): Plan => ({
    id: uid(),
    name: "",
    start: today,
    end: "",
    hasEndDate: false,
    cohort: "",
    method: "Auto",
    type: "Dynamic",
    allUsers: false,
    department: "",
    role: "",
    location: "",
    employeeIds: [],
    skills: initialSkills ?? [],
    status: "Active",
    assignedNames: [],
    departments: [],
    roles: [],
    cohorts: [],
  });
  const [draft, setDraft] = useState<Plan | null>(
    initialSkills?.length ? blankDraft() : null,
  );
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [error, setError] = useState(""),
    [inactivatingPlan, setInactivatingPlan] = useState<Plan | null>(null),
    [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);
  useEffect(() => {
    if (error) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [error]);
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
  function begin(p?: Plan, preSkills?: { skillId: string; expected: string }[]) {
    setError("");
    setWizardStep(1);
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
            type: "Dynamic",
            allUsers: false,
            department: "",
            role: "",
            location: "",
            employeeIds: [],
            skills: preSkills ?? [],
            status: "Active",
            assignedNames: [],
            departments: [],
            roles: [],
            cohorts: [],
          },
    );
  }

  /** Selected skills with no course mapped at any level. */
  function unmappedSkills(): string[] {
    return (draft?.skills ?? [])
      .filter((s) => !work.courses.some((c) => c.mappings.some((m) => m.skillId === s.skillId)))
      .map((s) => data.skills.find((x) => x.id === s.skillId)?.name || "Unknown skill");
  }
  function validateStep1(): boolean {
    if (!draft) return false;
    if (!draft.name.trim()) { setError("Enter an assignment name."); return false; }
    if (!draft.skills.length || draft.skills.some((s) => !s.expected)) {
      setError("Select at least one skill and set an expected level for each.");
      return false;
    }
    if (unmappedSkills().length) {
      setError(`No courses are mapped to the selected skill: ${unmappedSkills().join(", ")}.`);
      return false;
    }
    setError("");
    return true;
  }
  const audience = draft ? matching(work, draft) : [];

  function validate() {
    if (!draft) return false;
    if (!draft.name.trim() || !draft.skills.length || draft.skills.some((s) => !s.expected) || !draft.start || (draft.hasEndDate && !draft.end)) {
      setError("Enter a name, select skills and their expected levels, and choose dates.");
      return false;
    }
    if (unmappedSkills().length) { setError(`No courses are mapped to the selected skill: ${unmappedSkills().join(", ")}.`); return false; }
    if (draft.end && draft.end < draft.start) { setError("End date must be on or after start date."); return false; }
    if (draft.method === "Manual" && !draft.employeeIds.length) { setError("Select at least one learner."); return false; }
    if (draft.method === "Auto" && !draft.allUsers && !draft.department && !draft.role && !draft.cohort && !draft.departments?.length && !draft.roles?.length && !draft.cohorts?.length) {
      setError("Choose All Users or at least one audience criterion (department, role, or cohort)."); return false;
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
                competencyId: s.competencyId ?? existing.competencyId,
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
              competencyId: s.competencyId,
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
    <section className="cm-inline-form cm-role-form" ref={formRef}>
      <div className="cm-inline-form-head">
        <button type="button" className="cm-text-button cm-inline-back" onClick={() => setDraft(null)}>
          <ArrowLeft size={15} /> Back to Assignments
        </button>
        <div className="cm-role-form-heading-row">
          <div>
            <h2>{draft.name.trim() || "New Assignment"}</h2>
            {wizardStep === 2 && (
              <p className="cm-inline-form-meta">
                {audience.length} matching learner{audience.length !== 1 ? "s" : ""} · {draft.skills.length} skill{draft.skills.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div className="cm-role-stepper" aria-label="Steps">
            <div className={`cm-role-step${wizardStep >= 1 ? " active" : ""}${wizardStep > 1 ? " done" : ""}`}>
              <span className="cm-role-step-num">{wizardStep > 1 ? "✓" : "1"}</span>
              <span className="cm-role-step-label">Details &amp; Skills</span>
            </div>
            <span className={`cm-role-step-connector${wizardStep > 1 ? " done" : ""}`} />
            <div className={`cm-role-step${wizardStep >= 2 ? " active" : ""}`}>
              <span className="cm-role-step-num">2</span>
              <span className="cm-role-step-label">Audience &amp; Schedule</span>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="cm-error" role="alert">{error}</div>}
      <AssignmentConfiguration data={data} work={work} draft={draft} onChange={setDraft} step={wizardStep} />
      <div className="cm-inline-form-actions">
        <button className="cm-button" onClick={() => setDraft(null)}>Cancel</button>
        {wizardStep === 1 ? (
          <button className="cm-button primary" onClick={() => { if (validateStep1()) setWizardStep(2); }}>
            Next: Audience &amp; Schedule
          </button>
        ) : (
          <>
            <button className="cm-button" onClick={() => { setError(""); setWizardStep(1); }}>Back</button>
            <button className="cm-button primary" onClick={assign}>Save &amp; Assign</button>
          </>
        )}
      </div>
    </section>
  );

  return (
    <section className="cm-card cm-role-mapping">
      <div className="cm-section-head">
        <div>
          <h2>Competency → Role Mapping</h2>
          <p>Choose required skills, define expectations, and assign them to the right people.</p>
        </div>
        <button className="cm-button primary" onClick={() => begin()}>
          <Plus size={16} />
          Create Assignment
        </button>
      </div>
      {!work.plans.length ? (
        <div className="cm-empty">
          <h3>Give Every Role a Clear Growth Path</h3>
          <p>Start with a competency, then choose skills and your target audience.</p>
          <button className="cm-button" onClick={() => begin()}>
            Create Your First Assignment
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
                    <span className={"cm-badge " + p.status.toLowerCase()}>{statusText(p.status)}</span>
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
              <DialogTitle>Are You Sure You Want to Inactivate {inactivatingPlan.name}?</DialogTitle>
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
    /* Skill cards the learner has collapsed (all start expanded). */
    [collapsedSkills, setCollapsedSkills] = useState<Set<string>>(new Set()),
    [submission, setSubmission] = useState<{ assignmentId: string } | null>(null),
    [file, setFile] = useState<File | null>(null),
    [remark, setRemark] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [openLevels, setOpenLevels] = useState<Record<string, boolean>>({});
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
        assignmentId: submission.assignmentId,
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
    const next =
      approved && p.courseId
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
      {manager ? (
        <div className="cm-section-head">
          <div>
            <h2>Team Skill Progress</h2>
            <p>Review evidence and help reportees close their skill gaps.</p>
          </div>
          <select
            aria-label="Select Reportee"
            value={selectedKey}
            onChange={(e) => (onLearnerChange || setLocalKey)(e.target.value)}
          >
            {people.map(([id, a]) => (
              <option key={id} value={id}>{a.name} · {a.department}</option>
            ))}
          </select>
        </div>
      ) : (() => {
        const firstA = assignments[0] ?? people[0]?.[1];
        const emp = firstA
          ? work.employees.find(
              (e) => e.id === firstA.employeeId || (e.name === firstA.name && e.department === firstA.department),
            )
          : null;
        const achieved = assignments.filter((a) => progress(data, a) === "Completed").length;
        const inProgress = assignments.filter((a) => progress(data, a) === "In Progress").length;
        const notStarted = assignments.filter((a) => progress(data, a) === "Yet to Start").length;
        const pct = assignments.length ? Math.round((achieved / assignments.length) * 100) : 0;
        const matchingPaths = emp?.role
          ? (work.careerPaths ?? []).filter((cp) => cp.status === "Active" && cp.roles.includes(emp.role))
          : [];
        const cp = matchingPaths[0] ?? null;
        const roleIdx = cp ? cp.roles.indexOf(emp!.role) : -1;
        const isLast = cp ? roleIdx === cp.roles.length - 1 : false;
        const nextRole = cp && !isLast ? cp.roles[roleIdx + 1] : null;
        const threshold = cp && !isLast ? cp.thresholds[roleIdx] : null;
        const meetsThreshold = threshold !== null && pct >= threshold!;
        return (
          <div className="cm-learner-header">
            {/* Title + selector row */}
            <div className="cm-learner-header-top">
              <div className="cm-learner-title-block">
                <h2>My Skills</h2>
                <p>Track your skills, close learning gaps, and achieve your learning goals.</p>
              </div>
              <select
                aria-label="Preview Learner"
                value={selectedKey}
                onChange={(e) => (onLearnerChange || setLocalKey)(e.target.value)}
              >
                {people.map(([id, a]) => (
                  <option key={id} value={id}>{a.name} · {a.department}</option>
                ))}
              </select>
            </div>

            {/* My career path widget */}
            {cp && emp?.role && (
              <div className="cm-cp-widget">
                <span className="cm-cp-title">My Career Path</span>
                <div className="cm-cp-roles">
                  {cp.roles.map((role, i) => {
                    const state = i < roleIdx ? "past" : i === roleIdx ? "current" : i === roleIdx + 1 ? "next" : "future";
                    const badge = state === "past" ? "Completed" : state === "current" ? "Current role" : state === "next" ? "Next role" : "Upcoming";
                    return (
                      <Fragment key={i}>
                        <div className={`cm-cp-role ${state}`}>
                          <span className="cm-cp-role-num">
                            {state === "past" ? <CheckCircle2 size={10} /> : i + 1}
                          </span>
                          <span className="cm-cp-role-name">{role}</span>
                          <span className="cm-cp-role-badge">{badge}</span>
                        </div>
                        {i < cp.roles.length - 1 && (
                          <span className="cm-cp-chevron" aria-hidden="true">›</span>
                        )}
                      </Fragment>
                    );
                  })}
                </div>
                <div className="cm-cp-progress-row">
                  <span className="cm-cp-progress-label">Role Competency Progress</span>
                  <progress className="cm-cp-progress-bar" max={100} value={pct} aria-label="Role Competency Progress" />
                  <span className="cm-cp-progress-pct">{pct}%</span>
                </div>
                {nextRole && threshold !== null && (
                  <p className="cm-cp-hint">Complete {threshold}% of your current role competencies to unlock the next role.</p>
                )}
              </div>
            )}

            {/* Stats row */}
            {assignments.length > 0 && (
              <div className="cm-learner-header-metrics">
                {!cp && (
                  <div className="cm-learner-progress-ring">
                    <svg viewBox="0 0 64 64" aria-hidden="true">
                      <circle cx="32" cy="32" r="26" fill="none" stroke="#dce8ff" strokeWidth="7" />
                      {pct > 0 && (
                        <circle
                          cx="32" cy="32" r="26" fill="none"
                          stroke="#2463d6" strokeWidth="7"
                          strokeDasharray={`${2 * Math.PI * 26 * pct / 100} ${2 * Math.PI * 26}`}
                          strokeLinecap="round"
                          transform="rotate(-90 32 32)"
                        />
                      )}
                      <text x="32" y="37" textAnchor="middle" className="cm-lp-donut-txt">{pct}%</text>
                    </svg>
                    <span>Overall Progress</span>
                  </div>
                )}
                <div className="cm-learner-stat-grid">
                  <div className="cm-learner-stat-card cm-lsc--total">
                    <strong>{assignments.length}</strong>
                    <span>Assigned Skills</span>
                  </div>
                  <div className="cm-learner-stat-card cm-lsc--achieved">
                    <strong>{achieved}</strong>
                    <span>Achieved</span>
                  </div>
                  <div className="cm-learner-stat-card cm-lsc--progress">
                    <strong>{inProgress}</strong>
                    <span>In Progress</span>
                  </div>
                  <div className="cm-learner-stat-card cm-lsc--notstarted">
                    <strong>{notStarted}</strong>
                    <span>Not Started</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}
      {manager && (
        <p className="cm-hint">
          Manager preview · All demo employees are shown. Production access must be limited to authorized reportees.
        </p>
      )}

      {/* View toggle (learner) and Expand All share one row so no empty gap is left. */}
      {assignments.length > 0 && (!manager || assignments.length > 1) && (
      <div className="cm-skill-toolbar">
      {!manager && (
        <div className="cm-view-toggle" role="group" aria-label="View Mode">
          <button
            className={skillView === "skill" ? "active" : ""}
            aria-pressed={skillView === "skill"}
            onClick={() => setSkillView("skill")}
          >
            <Target size={15} /> Skill View
          </button>
          <button
            className={skillView === "competency" ? "active" : ""}
            aria-pressed={skillView === "competency"}
            onClick={() => setSkillView("competency")}
          >
            <Layers size={15} /> Competency View
          </button>
        </div>
      )}
      {(manager || skillView === "skill") && assignments.length > 1 && (
        <div className="cm-skill-expand-bar">
          <button
            type="button"
            className="cm-button"
            onClick={() =>
              setCollapsedSkills(collapsedSkills.size ? new Set() : new Set(assignments.map((a) => a.id)))
            }
          >
            {collapsedSkills.size ? "Expand All" : "Collapse All"}
          </button>
        </div>
      )}
      </div>
      )}


      {/* Competency view — grouped by competency */}
      {!manager && skillView === "competency" && (() => {
        const grouped = new Map<string, typeof assignments>();
        for (const a of assignments) {
          const skill = data.skills.find((s) => s.id === a.skillId);
          const cId = compIdsOf(skill)[0] || "__none__";
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
                      <strong>{comp?.name || "No competency"}</strong>
                      <span className="cm-category">{items.length} Skill{items.length !== 1 ? "s" : ""}</span>
                      <span className={`cm-badge ${compStatus === "Completed" ? "active" : compStatus === "In Progress" ? "draft" : ""}`}>
                        {statusText(compStatus)}
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
                            {a.current ? data.levels.find((l) => l.id === a.current)?.name : "Not Assessed"}
                            {" → "}
                            {data.levels.find((l) => l.id === a.expected)?.name}
                            {missing && <span className="cm-content-missing"><AlertTriangle size={12} /> Content Missing</span>}
                          </span>
                          <span className={`cm-badge ${st === "Completed" ? "active" : st === "In Progress" ? "draft" : ""}`}>{statusText(st)}</span>
                          {st !== "Completed" && gap > 0 && <span className="cm-gap-chip">{gap} Level{gap !== 1 ? "s" : ""} To Go</span>}
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
        // Only the levels this competency requires ("Required up to") are shown.
        const lv = assignmentLevels(data, a);
        const currentIndex = lv.findIndex((l) => l.id === a.current);
        const expectedIndex = lv.findIndex((l) => l.id === a.expected);
        return (
          <article className={"cm-learning-card" + (collapsedSkills.has(a.id) ? " is-collapsed" : "")} key={a.id}>
            <div className="cm-section-head">
              <div>
                <h2>
                  <button
                    type="button"
                    className="cm-skill-toggle"
                    aria-expanded={!collapsedSkills.has(a.id)}
                    aria-controls={`skill-body-${a.id}`}
                    onClick={() =>
                      setCollapsedSkills((prev) => {
                        const next = new Set(prev);
                        if (next.has(a.id)) next.delete(a.id); else next.add(a.id);
                        return next;
                      })
                    }
                  >
                    <DisclosureIcon open={!collapsedSkills.has(a.id)} />
                    {data.skills.find((s) => s.id === a.skillId)?.name}
                  </button>
                </h2>
                <p>
                  {a.current === a.expected
                    ? (data.levels.find((l) => l.id === a.current)?.name || "Not assessed")
                    : (data.levels.find((l) => l.id === a.current)?.name || "Not assessed") + " → " + (data.levels.find((l) => l.id === a.expected)?.name ?? "")}
                </p>
              </div>
              <div className="cm-head-actions">
                {!manager && (() => {
                  const skillProof = work.proofs
                    .filter((p) => p.assignmentId === a.id && !p.courseId)
                    .at(-1);
                  if (progress(data, a) === "Completed") return null;
                  return (
                    <button
                      className="cm-button cm-button-sm"
                      disabled={skillProof?.status === "Under Review"}
                      title={skillProof?.status === "Under Review" ? "Proof Already Submitted — Awaiting Review" : ""}
                      onClick={() => {
                        setError("");
                        setFile(null);
                        setSubmission({ assignmentId: a.id });
                      }}
                    >
                      {skillProof?.status === "Under Review" ? "Under Review" : "Submit Proof"}
                    </button>
                  );
                })()}
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
            </div>
            {!collapsedSkills.has(a.id) && (
            <div id={`skill-body-${a.id}`}>
            <div className="cm-level-track">
              {lv.map((l, i) => (
                <div
                  key={l.id}
                  className={
                    i === currentIndex
                      ? "current"
                      : i < currentIndex
                        ? "done"
                        : i > expectedIndex
                          ? "beyond"
                          : ""
                  }
                >
                  <span>
                    {i < currentIndex ? <CheckCircle2 size={17} /> : i + 1}
                  </span>
                  <strong>
                    {l.name}
                    {i === currentIndex && (
                      <span className="cm-level-current-badge">Current</span>
                    )}
                  </strong>
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
                Update Current Level
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
                  <option value="">Not Recorded</option>
                  {lv.slice(0, expectedIndex + 1).map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {!a.current && (
              <p className="cm-hint cm-not-assessed">
                Not assessed — your administrator or manager needs to record your current level before your learning plan can be generated.
              </p>
            )}
            {a.current &&
              currentIndex < expectedIndex && (() => {
                const missingLevels = lv
                  .slice(currentIndex + 1, expectedIndex + 1)
                  .filter((l) => !work.courses.some((c) => c.mappings.some((m) => m.skillId === a.skillId && m.levelId === l.id)));
                if (!missingLevels.length) return null;
                const skillName = data.skills.find((s) => s.id === a.skillId)?.name || "this skill";
                const compName = compNames(data, data.skills.find((s) => s.id === a.skillId));
                return (
                  <p className="cm-hint cm-content-missing-hint">
                    <AlertTriangle size={14} />
                    {" "}Learning unavailable — required learning for {skillName} ({missingLevels.map((l) => l.name).join(", ")}) under {compName} has not been configured. Please contact your administrator.
                  </p>
                );
              })()}
            {courses.length > 0 && (
              <div className="cm-course-table-wrap">
                <table className="cm-course-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Level</th>
                      <th>Duration</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((c) => {
                      const proof = work.proofs
                        .filter((p) => p.assignmentId === a.id && p.courseId === c.id)
                        .at(-1);
                      const status = done.includes(c.id)
                        ? "Completed"
                        : proof?.status ?? "Not Started";
                      const statusClass = done.includes(c.id)
                        ? "active"
                        : proof
                          ? "draft"
                          : "pending";
                      return (
                        <tr key={c.id}>
                          <td>
                            <div className="cm-ct-course">
                              <BookOpen size={14} />
                              {c.name}
                            </div>
                          </td>
                          <td><span className="cm-level-badge">{c.level.name}</span></td>
                          <td className="cm-ct-dur">{c.duration}</td>
                          <td><span className={`cm-badge cm-badge-sm ${statusClass}`}>{statusText(status)}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            </div>
            )}
          </article>
        );
      })}


      {manager && (
        <>
          <h3>Proof Submissions</h3>
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
                  <span className="cm-badge">{statusText(p.status)}</span>
                </div>
                <a className="cm-link" href={p.document} download={p.fileName}>
                  <FileText size={16} />
                  Download submitted proof
                </a>
                {p.status === "Under Review" ? (
                  <>
                    <label>
                      Review Remarks
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
                        Reject with Feedback
                      </button>
                      <button
                        className="cm-button primary"
                        onClick={() => review(p, true)}
                      >
                        Approve Proof
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
              <DialogTitle>Submit Proof of Completion</DialogTitle>
              <DialogDescription>
                Upload a certificate or supporting document for your manager to
                review.
              </DialogDescription>
            </DialogHeader>
            <label>
              Certificate or Document
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
                {busy ? "Saving…" : "Submit for Review"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
