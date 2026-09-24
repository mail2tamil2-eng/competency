import { useState } from "react";
import { FileText, Download } from "lucide-react";
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
  const currentRank = data.levels.findIndex((l) => l.id === a.current);
  const higherLevels = data.levels.filter(
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
          <DialogTitle>Update current level</DialogTitle>
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
                {
                  data.competencies.find((c) => c.id === skill?.competencyId)
                    ?.name
                }
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
            New current level
            <select
              aria-label="New current level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="" disabled>
                {higherLevels.length
                  ? "Choose a higher level"
                  : "No higher level available"}
              </option>
              {data.levels.map((l, index) => (
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
            Remarks (optional)
            <textarea
              aria-label="Remarks (optional)"
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
            Save level
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
  const isImage = usable && p.document.startsWith("data:image/");
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
          <DialogTitle>Review proof submissions</DialogTitle>
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
                    · {proof.status}
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
                  <dd>{p.status}</dd>
                </div>
              </dl>
              <div className="cm-manager-evidence">
                <div className="cm-section-head">
                  <div>
                    <FileText size={20} />
                    <strong>{p.fileName}</strong>
                    <small>Submitted {p.submitted}</small>
                  </div>
                  {usable && (
                    <a
                      className="cm-button"
                      href={p.document}
                      download={p.fileName}
                    >
                      <Download size={16} />
                      Download proof
                    </a>
                  )}
                </div>
                {isImage ? (
                  <img
                    src={p.document}
                    alt={`Submitted evidence: ${p.fileName}`}
                  />
                ) : usable ? (
                  <object
                    data={p.document}
                    type="application/pdf"
                    aria-label="Submitted proof preview"
                  >
                    <p>
                      PDF preview is unavailable in this browser. Download the
                      proof to inspect it.
                    </p>
                  </object>
                ) : (
                  <p className="cm-error">
                    This proof cannot be previewed. Ask the learner to submit a
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
                    Review feedback
                    <textarea
                      aria-label="Review feedback"
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
                    {p.status} by {p.reviewedBy || "Manager"}
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
                Reject with feedback
              </button>
              <button
                className="cm-button primary"
                disabled={!usable || !level}
                onClick={() => decide(true)}
              >
                Approve proof
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
