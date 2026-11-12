import { compNames, assignmentLevels } from "./model";
import { statusText } from "./displayText";
import { useState } from "react";
import { FileText, Download, ArrowLeft, CheckCircle2, BookOpen, ExternalLink } from "lucide-react";
import { useProofUrl } from "./proofLink";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import type { ManagerProps } from "./ManagerProgress";
import {
  latestProofs,
  levelName,
  managerLevel,
  reviewProof,
  saveCompletedCourses,
} from "./managerModel";
type Props = ManagerProps & { assignmentId: string; onClose: () => void };

export function ManagerSkillDialog({
  data,
  work,
  save,
  assignmentId,
  onClose,
}: Props) {
  const a = data.assignments.find((a) => a.id === assignmentId)!;
  const skill = data.skills.find((s) => s.id === a.skillId);
  const [level, setLevel] = useState(""),
    [remarks, setRemarks] = useState(""),
    [error, setError] = useState("");
  // Only the levels this skill's competency requires ("Required up to") are offered.
  const skillLv = assignmentLevels(data, a);
  const currentRank = skillLv.findIndex((l) => l.id === a.current);
  const higherLevels = skillLv.filter(
    (l, i) => l.status === "Active" && i > currentRank,
  );
  function submit() {
    try {
      const next = managerLevel(
        data,
        a,
        level,
        remarks.trim() || "Manual proficiency assessment by manager",
      );
      if (save(next, work, "Current skill level updated")) onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="cm-dialog cm-wide cm-progress-dialog">
        <DialogHeader>
          <DialogTitle>Update Current Level</DialogTitle>
          <DialogDescription>
            Only this learner’s selected skill will change when you save.
          </DialogDescription>
        </DialogHeader>
        <div className="cm-progress-dialog-body">
          <dl className="cm-progress-context">
            <div>
              <dt>Learner</dt>
              <dd>{a.name}</dd>
            </div>
            <div>
              <dt>Competency</dt>
              <dd>
                {compNames(data, skill)}
              </dd>
            </div>
            <div>
              <dt>Skill</dt>
              <dd>{skill?.name}</dd>
            </div>
            <div>
              <dt>Current → expected</dt>
              <dd>
                {levelName(data, a.current)} → {levelName(data, a.expected)}
              </dd>
            </div>
          </dl>
          <label>
            New Current Level
            <select
              aria-label="New Current Level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="" disabled>
                {higherLevels.length
                  ? "Choose a Higher Level"
                  : "No Higher Level Available"}
              </option>
              {skillLv.map((l, index) => (
                <option
                  key={l.id}
                  value={l.id}
                  disabled={index <= currentRank || l.status !== "Active"}
                >
                  {l.name}
                  {index <= currentRank
                    ? " — Completed"
                    : l.status !== "Active"
                      ? " — Unavailable"
                      : ""}
                </option>
              ))}
            </select>
          </label>
          <p className="cm-hint">
            {higherLevels.length
              ? "Only levels higher than the current proficiency can be selected."
              : "This skill is already at the highest available active level. No further update is possible."}
          </p>
          {error && (
            <p role="alert" className="cm-error">
              {error}
            </p>
          )}
          <label>
            Remarks (Optional)
            <textarea
              aria-label="Remarks (Optional)"
              value={remarks}
              maxLength={2000}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add a note about this proficiency update."
            />
          </label>
          <details className="cm-manager-history">
            <summary>
              Level update history ({a.levelHistory?.length || 0})
            </summary>
            {a.levelHistory?.length ? (
              [...a.levelHistory].reverse().map((entry, index) => (
                <div key={`${entry.at}-${index}`}>
                  <strong>
                    {levelName(data, entry.from)} → {levelName(data, entry.to)}
                  </strong>
                  <small>
                    {entry.by} · {new Date(entry.at).toLocaleString()}
                  </small>
                  <p>{entry.reason}</p>
                </div>
              ))
            ) : (
              <p>No level updates recorded yet.</p>
            )}
          </details>
        </div>
        <div className="cm-dialog-actions">
          <button className="cm-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="cm-button primary"
            disabled={!higherLevels.some((l) => l.id === level)}
            onClick={submit}
          >
            Save Level
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ManagerProofDialog({
  data,
  work,
  save,
  assignmentId,
  onClose,
  initialProofId,
}: Props & { initialProofId?: string }) {
  const a = data.assignments.find((a) => a.id === assignmentId)!;
  const latest = latestProofs(work, assignmentId);
  const [selected, setSelected] = useState(
    initialProofId ||
      latest.find((p) => p.status === "Under Review")?.id ||
      latest[0]?.id ||
      "",
  );
  const [remarks, setRemarks] = useState(""),
    [error, setError] = useState("");
  const p = work.proofs.find((p) => p.id === selected);
  const course = work.courses.find((c) => c.id === p?.courseId);
  const skill = data.skills.find((s) => s.id === a.skillId);
  const level =
    p?.levelId ||
    course?.mappings.find((m) => m.skillId === a.skillId)?.levelId ||
    "";
  const usable =
    p &&
    /^data:(application\/pdf|image\/png|image\/jpeg);base64,[a-z0-9+/=\s]+$/i.test(
      p.document,
    );
  const pOpenUrl = useProofUrl(usable ? p.document : undefined);
  function decide(approved: boolean) {
    try {
      const next = reviewProof(data, work, selected, approved, remarks);
      if (
        save(
          next.data,
          next.work,
          approved
            ? "Proof approved. Skill progress updated."
            : "Proof rejected with feedback.",
        )
      ) {
        setRemarks("");
        setError("");
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="cm-dialog cm-wide cm-progress-dialog cm-manager-proof-dialog">
        <DialogHeader>
          <DialogTitle>Review Proof Submissions</DialogTitle>
          <DialogDescription>
            {a.name} · {skill?.name}. Inspect the evidence and record your
            decision.
          </DialogDescription>
        </DialogHeader>
        <div className="cm-progress-dialog-body">
          {latest.length > 1 && (
            <label>
              Submission
              <select
                aria-label="Submission"
                value={selected}
                onChange={(e) => {
                  setSelected(e.target.value);
                  setRemarks("");
                  setError("");
                }}
              >
                {latest.map((proof) => (
                  <option key={proof.id} value={proof.id}>
                    {work.courses.find((c) => c.id === proof.courseId)?.name ||
                      "Unavailable course"}{" "}
                    · {statusText(proof.status)}
                  </option>
                ))}
              </select>
            </label>
          )}
          {p ? (
            <>
              <dl className="cm-progress-context">
                <div>
                  <dt>Course name</dt>
                  <dd>{course?.name || "Unavailable course"}</dd>
                </div>
                <div>
                  <dt>Mapped skill</dt>
                  <dd>{skill?.name || "Unavailable skill"}</dd>
                </div>
                <div>
                  <dt>Skill level</dt>
                  <dd>{levelName(data, level)}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{statusText(p.status)}</dd>
                </div>
              </dl>
              <div className="cm-manager-evidence">
                <div className="cm-section-head">
                  <div>
                    <FileText size={20} />
                    <strong>{p.fileName}</strong>
                    <small>Submitted {p.submitted}</small>
                  </div>
                  {usable && pOpenUrl && (
                    <div className="cm-proof-doc-card-actions">
                      <a className="cm-button primary" href={pOpenUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={16} /> Open document
                      </a>
                      <a className="cm-button" href={p.document} download={p.fileName}>
                        <Download size={16} /> Download
                      </a>
                    </div>
                  )}
                </div>
                {!usable && (
                  <p className="cm-error">
                    This proof cannot be opened. Ask the learner to submit a
                    valid PDF, PNG or JPEG.
                  </p>
                )}
              </div>
              {p.status === "Under Review" ? (
                <>
                  <p className="cm-hint">
                    Approval records this course as completed and raises the
                    current skill level to {levelName(data, level)} if it is
                    higher. Other courses remain unchanged.
                  </p>
                  <label>
                    Review Feedback
                    <textarea
                      aria-label="Review Feedback"
                      placeholder="Required when rejecting evidence"
                      value={remarks}
                      maxLength={2000}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </label>
                </>
              ) : (
                <div className="cm-hint">
                  <strong>
                    {statusText(p.status)} By {p.reviewedBy || "Manager"}
                  </strong>
                  {p.reviewedAt && (
                    <p>{new Date(p.reviewedAt).toLocaleString()}</p>
                  )}
                  <p>{p.remarks || "No additional feedback."}</p>
                </div>
              )}
              {work.proofs.filter(
                (x) =>
                  x.assignmentId === a.id &&
                  x.courseId === p.courseId &&
                  x.id !== p.id,
              ).length > 0 && (
                <details className="cm-manager-history">
                  <summary>Previous submissions</summary>
                  {work.proofs
                    .filter(
                      (x) =>
                        x.assignmentId === a.id &&
                        x.courseId === p.courseId &&
                        x.id !== p.id,
                    )
                    .map((x) => (
                      <div key={x.id}>
                        <strong>
                          {x.fileName} · {x.status}
                        </strong>
                        <small>{x.submitted}</small>
                        <p>{x.remarks || "No feedback recorded"}</p>
                      </div>
                    ))}
                </details>
              )}
            </>
          ) : (
            <p>No submissions yet.</p>
          )}
          {error && (
            <p role="alert" className="cm-error">
              {error}
            </p>
          )}
        </div>
        <div className="cm-dialog-actions">
          <button className="cm-button" onClick={onClose}>
            Close
          </button>
          {p?.status === "Under Review" && (
            <>
              <button
                className="cm-button cm-manager-reject"
                onClick={() => decide(false)}
              >
                Reject with Feedback
              </button>
              <button
                className="cm-button primary"
                disabled={!usable || !level}
                onClick={() => decide(true)}
              >
                Approve Proof
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ManagerProofReviewPage({
  data,
  work,
  save,
  assignmentId,
  proofId,
  onClose,
}: ManagerProps & { assignmentId: string; proofId: string; onClose: () => void }) {
  const a = data.assignments.find((x) => x.id === assignmentId)!;
  const proof = work.proofs.find((p) => p.id === proofId);
  const skill = data.skills.find((s) => s.id === a.skillId);
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentIdx = data.levels.findIndex((l) => l.id === a.current);
  const expectedIdx = data.levels.findIndex((l) => l.id === a.expected);
  const relevantLevels = data.levels.slice(
    Math.max(0, currentIdx + 1),
    expectedIdx + 1,
  );

  const initialDone = new Set<string>(work.completed[assignmentId] || []);
  const [selected, setSelected] = useState<Set<string>>(initialDone);

  const usable =
    proof &&
    /^data:(application\/pdf|image\/png|image\/jpeg);base64,[a-z0-9+/=\s]+$/i.test(
      proof.document,
    );
  const isImage = usable && proof.document.startsWith("data:image/");
  const openUrl = useProofUrl(usable ? proof.document : undefined);

  function isLevelUnlocked(li: number): boolean {
    if (li === 0) return true;
    const prev = relevantLevels[li - 1];
    const prevCourses = work.courses.filter((c) =>
      c.mappings.some((m) => m.skillId === a.skillId && m.levelId === prev.id),
    );
    return prevCourses.length > 0 && prevCourses.every((c) => selected.has(c.id));
  }

  function toggleCourse(courseId: string, li: number) {
    const next = new Set(selected);
    if (next.has(courseId)) {
      next.delete(courseId);
      for (let i = li + 1; i < relevantLevels.length; i++) {
        work.courses
          .filter((c) =>
            c.mappings.some(
              (m) => m.skillId === a.skillId && m.levelId === relevantLevels[i].id,
            ),
          )
          .forEach((c) => next.delete(c.id));
      }
    } else {
      next.add(courseId);
    }
    setSelected(next);
    setSaved(false);
  }

  function toggleLevel(li: number, check: boolean) {
    const next = new Set(selected);
    const level = relevantLevels[li];
    const levelCourses = work.courses.filter((c) =>
      c.mappings.some((m) => m.skillId === a.skillId && m.levelId === level.id),
    );
    if (check) {
      levelCourses.forEach((c) => next.add(c.id));
    } else {
      levelCourses.forEach((c) => next.delete(c.id));
      for (let i = li + 1; i < relevantLevels.length; i++) {
        work.courses
          .filter((c) =>
            c.mappings.some(
              (m) => m.skillId === a.skillId && m.levelId === relevantLevels[i].id,
            ),
          )
          .forEach((c) => next.delete(c.id));
      }
    }
    setSelected(next);
    setSaved(false);
  }

  function decide(approved: boolean) {
    if (!proof) return;
    try {
      const next = reviewProof(data, work, proof.id, approved, remarks);
      let finalData = next.data;
      let finalWork = next.work;
      if (approved && selected.size > 0) {
        const courseNext = saveCompletedCourses(finalData, finalWork, assignmentId, [...selected]);
        finalData = courseNext.data;
        finalWork = courseNext.work;
      }
      save(finalData, finalWork, approved ? "Proof approved." : "Proof rejected with feedback.");
      setRemarks("");
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function saveSelection() {
    setSaving(true);
    try {
      const next = saveCompletedCourses(data, work, assignmentId, [...selected]);
      if (save(next.data, next.work, "Course completion updated")) setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    }
    setSaving(false);
  }

  const isApproved = proof?.status === "Approved";
  const savedCourses = new Set<string>(work.completed[assignmentId] || []);
  const hasChanges =
    selected.size !== savedCourses.size ||
    [...selected].some((id) => !savedCourses.has(id));

  return (
    <div className="cm-proof-page">
      <div className="cm-proof-page-header">
        <button className="cm-text-button cm-proof-back" onClick={onClose}>
          <ArrowLeft size={16} /> Back to Proof Submissions
        </button>
        <div className="cm-proof-page-title">
          <h2>Review Proof Submission</h2>
          <p>{a.name} · {skill?.name}</p>
        </div>
        <div className="cm-proof-header-meta">
          <span><span className="cm-proof-meta-label">Target Level</span>{levelName(data, a.expected)}</span>
          <span><span className="cm-proof-meta-label">Current Level</span>{levelName(data, a.current)}</span>
          <span><span className="cm-proof-meta-label">Submitted</span>{proof?.submitted || "—"}</span>
        </div>
        <span className={`cm-manager-status ${proof?.status === "Approved" ? "success" : proof?.status === "Rejected" ? "rejected" : "pending"}`}>
          {proof?.status || "No submission"}
        </span>
      </div>

      <div className="cm-proof-page-body">
        {/* Submitted document: link opens it in a new tab (no inline preview) */}
        <div className="cm-proof-doc-card">
          <FileText size={22} />
          <div className="cm-proof-doc-card-text">
            <strong>{proof?.fileName || "No document"}</strong>
            <small>Submitted {proof?.submitted}</small>
          </div>
          {usable && openUrl ? (
            <div className="cm-proof-doc-card-actions">
              <a className="cm-button primary" href={openUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={15} /> Open document
              </a>
              <a className="cm-button" href={proof.document} download={proof.fileName}>
                <Download size={15} /> Download
              </a>
            </div>
          ) : (
            <span className="cm-proof-doc-card-none">This file can't be opened. Ask the learner to resubmit a PDF, PNG or JPEG.</span>
          )}
        </div>

        {/* RIGHT */}
        <div className="cm-proof-right">
          {/* Under Review: courses + feedback + action buttons in one card */}
          {proof?.status === "Under Review" && (
            <div className="cm-proof-actions-card">
              {relevantLevels.length > 0 && (
                <>
                  <div className="cm-hier-header-row">
                    <h4>Mark Completed Courses</h4>
                    <span className="cm-hier-strip-text">Select courses completed, then approve below.</span>
                  </div>
                  <div className="cm-hier-levels">
                    {relevantLevels.map((level, li) => {
                      const unlocked = isLevelUnlocked(li);
                      const levelCourses = work.courses.filter((c) =>
                        c.mappings.some((m) => m.skillId === a.skillId && m.levelId === level.id),
                      );
                      const doneCount = levelCourses.filter((c) => selected.has(c.id)).length;
                      const allChecked = levelCourses.length > 0 && doneCount === levelCourses.length;
                      const someChecked = doneCount > 0 && !allChecked;
                      const levelState: "active" | "done" | "disabled" = !unlocked ? "disabled" : allChecked ? "done" : "active";
                      return (
                        <div key={level.id} className={`cm-hier-level cm-hier-level--${levelState}`}>
                          <div className="cm-hier-level-header">
                            <label className="cm-hier-level-label">
                              <input
                                type="checkbox"
                                checked={allChecked}
                                ref={(el) => { if (el) el.indeterminate = someChecked; }}
                                disabled={!unlocked || levelCourses.length === 0}
                                onChange={(e) => toggleLevel(li, e.target.checked)}
                              />
                              <span className={`cm-hier-num cm-hier-num--${levelState}`}>
                                {allChecked ? <CheckCircle2 size={12} /> : li + 1}
                              </span>
                              <span className="cm-hier-name">{level.name}</span>
                            </label>
                            <div className="cm-hier-count">
                              {levelCourses.length > 0 ? `${doneCount}/${levelCourses.length}` : "—"}
                              {allChecked && <span className="cm-hier-done-chip">Complete</span>}
                            </div>
                          </div>
                          {levelCourses.length > 0 && (
                            <div className="cm-hier-courses">
                              {levelCourses.map((c) => (
                                <label key={c.id} className={`cm-hier-course${!unlocked ? " cm-hier-course--disabled" : ""}`}>
                                  <input
                                    type="checkbox"
                                    checked={selected.has(c.id)}
                                    disabled={!unlocked}
                                    onChange={() => toggleCourse(c.id, li)}
                                  />
                                  <BookOpen size={13} className="cm-hier-course-icon" />
                                  <span className="cm-hier-course-name">{c.name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="cm-proof-card-divider" />
                </>
              )}
              {relevantLevels.length === 0 && <h4>Review Decision</h4>}
              <label className="cm-proof-feedback-label">
                Feedback <span className="cm-hint-inline">(required when rejecting)</span>
                <textarea
                  value={remarks}
                  maxLength={2000}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Explain what the learner should correct or note for approval…"
                  rows={3}
                />
              </label>
              {error && <p className="cm-error" role="alert">{error}</p>}
              <div className="cm-proof-action-btns">
                <button className="cm-button cm-manager-reject" onClick={() => decide(false)}>
                  Reject with Feedback
                </button>
                <button
                  className="cm-button primary"
                  disabled={!usable}
                  onClick={() => decide(true)}
                >
                  Approve Proof
                </button>
              </div>
            </div>
          )}

          {/* Approved: course completion with save */}
          {isApproved && relevantLevels.length > 0 && (
            <div className="cm-proof-actions-card">
              <div className="cm-hier-header-row">
                <h4>Mark Completed Courses</h4>
                <span className="cm-hier-strip-text">Complete each level to unlock the next.</span>
              </div>
              <div className="cm-hier-levels">
                {relevantLevels.map((level, li) => {
                  const unlocked = isLevelUnlocked(li);
                  const levelCourses = work.courses.filter((c) =>
                    c.mappings.some((m) => m.skillId === a.skillId && m.levelId === level.id),
                  );
                  const doneCount = levelCourses.filter((c) => selected.has(c.id)).length;
                  const allChecked = levelCourses.length > 0 && doneCount === levelCourses.length;
                  const someChecked = doneCount > 0 && !allChecked;
                  const levelState: "active" | "done" | "disabled" = !unlocked ? "disabled" : allChecked ? "done" : "active";
                  return (
                    <div key={level.id} className={`cm-hier-level cm-hier-level--${levelState}`}>
                      <div className="cm-hier-level-header">
                        <label className="cm-hier-level-label">
                          <input
                            type="checkbox"
                            checked={allChecked}
                            ref={(el) => { if (el) el.indeterminate = someChecked; }}
                            disabled={!unlocked || levelCourses.length === 0}
                            onChange={(e) => toggleLevel(li, e.target.checked)}
                          />
                          <span className={`cm-hier-num cm-hier-num--${levelState}`}>
                            {allChecked ? <CheckCircle2 size={12} /> : li + 1}
                          </span>
                          <span className="cm-hier-name">{level.name}</span>
                        </label>
                        <div className="cm-hier-count">
                          {levelCourses.length > 0 ? `${doneCount}/${levelCourses.length}` : "—"}
                          {allChecked && <span className="cm-hier-done-chip">Complete</span>}
                        </div>
                      </div>
                      {levelCourses.length > 0 && (
                        <div className="cm-hier-courses">
                          {levelCourses.map((c) => (
                            <label key={c.id} className={`cm-hier-course${!unlocked ? " cm-hier-course--disabled" : ""}`}>
                              <input
                                type="checkbox"
                                checked={selected.has(c.id)}
                                disabled={!unlocked}
                                onChange={() => toggleCourse(c.id, li)}
                              />
                              <BookOpen size={13} className="cm-hier-course-icon" />
                              <span className="cm-hier-course-name">{c.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {error && <p className="cm-error" role="alert">{error}</p>}
              <div className="cm-hier-save-row">
                <button
                  className="cm-button primary"
                  disabled={saving || (!hasChanges && !saved)}
                  onClick={saveSelection}
                >
                  {saving ? "Saving…" : saved ? "Saved ✓" : "Save Completion"}
                </button>
              </div>
            </div>
          )}

          {proof?.status === "Rejected" && (
            <div className="cm-proof-actions-card">
              <h4>Decision Recorded</h4>
              <p><strong>Rejected</strong> by {proof.reviewedBy || "Manager"}</p>
              {proof.reviewedAt && <small>{new Date(proof.reviewedAt).toLocaleString()}</small>}
              <p className="cm-hint">{proof.remarks || "No feedback recorded."}</p>
            </div>
          )}

          {proof && (
            <div className="cm-proof-actions-card">
              <h4>Activity Log</h4>
              <div className="cm-activity-log">
                <div className="cm-activity-entry">
                  <span className="cm-activity-dot cm-activity-dot--neutral" />
                  <div className="cm-activity-content">
                    <strong>Proof Submitted</strong>
                    <span className="cm-activity-time">{proof.submitted}</span>
                    <span className="cm-activity-meta">{proof.fileName}</span>
                  </div>
                </div>
                {proof.status !== "Under Review" && (
                  <div className="cm-activity-entry">
                    <span className={`cm-activity-dot cm-activity-dot--${proof.status === "Approved" ? "success" : "rejected"}`} />
                    <div className="cm-activity-content">
                      <strong>Proof {proof.status === "Approved" ? "approved" : "rejected"}</strong>
                      <span className="cm-activity-time">
                        {proof.reviewedBy || "Manager"}{proof.reviewedAt ? ` · ${new Date(proof.reviewedAt).toLocaleDateString()}` : ""}
                      </span>
                      {proof.remarks && <span className="cm-activity-meta">{proof.remarks}</span>}
                    </div>
                  </div>
                )}
                {(a.levelHistory || []).map((entry, i) => (
                  <div key={i} className="cm-activity-entry">
                    <span className="cm-activity-dot cm-activity-dot--level" />
                    <div className="cm-activity-content">
                      <strong>{levelName(data, entry.from)} → {levelName(data, entry.to)}</strong>
                      <span className="cm-activity-time">
                        {entry.by} · {new Date(entry.at).toLocaleDateString()}
                      </span>
                      {entry.reason && <span className="cm-activity-meta">{entry.reason}</span>}
                    </div>
                  </div>
                ))}
                {(work.completed[assignmentId] || []).length > 0 && (() => {
                  const completedIds = work.completed[assignmentId];
                  const byLevel = data.levels
                    .map((lv) => ({
                      lv,
                      courses: work.courses.filter(
                        (c) =>
                          completedIds.includes(c.id) &&
                          c.mappings.some(
                            (m) => m.skillId === a.skillId && m.levelId === lv.id,
                          ),
                      ),
                    }))
                    .filter((g) => g.courses.length > 0);
                  return (
                    <div className="cm-activity-entry">
                      <span className="cm-activity-dot cm-activity-dot--courses" />
                      <div className="cm-activity-content">
                        <strong>Completed Courses Saved</strong>
                        <span className="cm-activity-time">{completedIds.length} Course{completedIds.length !== 1 ? "s" : ""} Marked</span>
                        <div className="cm-activity-levels">
                          {byLevel.map(({ lv, courses }) => (
                            <div key={lv.id} className="cm-activity-level-group">
                              <span className="cm-activity-level-tag">{lv.name}</span>
                              <ul className="cm-activity-courses">
                                {courses.map((c) => (
                                  <li key={c.id}>{c.name}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
