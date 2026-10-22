import { Fragment, useState } from "react";
import { Plus, Pencil, Trash2, ChevronRight, Route, Ban, CheckCircle2 } from "lucide-react";
import { Data, uid } from "./model";
import { WorkflowData, CareerPath, syncProgressions } from "./workflowModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";

const MAX_ROLES = 5;
const MIN_ROLES = 2;

type Props = {
  data: Data;
  work: WorkflowData;
  save: (data: Data, work: WorkflowData, message: string) => boolean;
};

export function CareerProgressionConfig({ data, work, save }: Props) {
  const [draft, setDraft] = useState<CareerPath | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<CareerPath | null>(null);
  const [deactivating, setDeactivating] = useState<CareerPath | null>(null);

  const allRoles = [...new Set(work.employees.map((e) => e.role).filter(Boolean))].sort();
  const paths = work.careerPaths ?? [];

  function begin(path?: CareerPath) {
    setErrors([]);
    setDraft(
      path
        ? structuredClone(path)
        : { id: uid(), name: "", roles: ["", ""], thresholds: [80], status: "Active" },
    );
  }

  function updateRole(i: number, value: string) {
    if (!draft) return;
    const roles = [...draft.roles];
    roles[i] = value;
    setDraft({ ...draft, roles });
    setErrors([]);
  }

  function updateThreshold(i: number, raw: string) {
    if (!draft) return;
    const v = Math.max(1, Math.min(100, parseInt(raw, 10) || 1));
    const thresholds = [...draft.thresholds];
    thresholds[i] = v;
    setDraft({ ...draft, thresholds });
  }

  function addRole() {
    if (!draft || draft.roles.length >= MAX_ROLES) return;
    setDraft({ ...draft, roles: [...draft.roles, ""], thresholds: [...draft.thresholds, 80] });
  }

  function removeRole(i: number) {
    if (!draft || draft.roles.length <= MIN_ROLES) return;
    const roles = draft.roles.filter((_, idx) => idx !== i);
    // Remove the threshold leading INTO the removed role (index i-1); for i=0 remove index 0.
    const removeIdx = i === 0 ? 0 : i - 1;
    const thresholds = draft.thresholds.filter((_, j) => j !== removeIdx);
    setDraft({ ...draft, roles, thresholds });
    setErrors([]);
  }

  function validate(): string[] {
    if (!draft) return [];
    const errs: string[] = [];
    if (!draft.name.trim()) errs.push("Career path name is required.");
    if (draft.roles.some((r) => !r.trim())) errs.push("All roles must be selected.");
    const seen = new Set<string>();
    for (const r of draft.roles) {
      if (r && seen.has(r)) { errs.push("Each role can only appear once in a path."); break; }
      if (r) seen.add(r);
    }
    for (let i = 0; i < draft.thresholds.length; i++) {
      const t = draft.thresholds[i];
      if (!t || t < 1 || t > 100)
        errs.push(`Threshold for step ${i + 1}→${i + 2} must be between 1 and 100.`);
    }
    const isDup = paths.some(
      (p) =>
        p.id !== draft.id &&
        p.roles.length === draft.roles.length &&
        p.roles.every((r, i) => r === draft.roles[i]),
    );
    if (isDup) errs.push("A career path with this exact role sequence already exists.");
    return errs;
  }

  function savePath() {
    if (!draft) return;
    const errs = validate();
    setErrors(errs);
    if (errs.length) return;
    const clean: CareerPath = { ...draft, name: draft.name.trim() };
    const isNew = !paths.some((p) => p.id === draft.id);
    const updatedPaths = isNew
      ? [...paths, clean]
      : paths.map((p) => (p.id === draft.id ? clean : p));
    const updatedWork = syncProgressions({ ...work, careerPaths: updatedPaths });
    if (save(data, updatedWork, isNew ? "Career path created" : "Career path updated"))
      setDraft(null);
  }

  const careerPathIsProtected = (path: CareerPath) =>
    work.employees.some(
      (e) =>
        path.roles.includes(e.role) &&
        data.assignments.some(
          (a) => a.employeeId === e.id || (a.name === e.name && a.department === e.department),
        ),
    );

  function toggleStatus(path: CareerPath) {
    if (path.status === "Active") { setDeactivating(path); return; }
    const updatedPaths = paths.map((p) =>
      p.id === path.id ? { ...p, status: "Active" as const } : p,
    );
    save(data, syncProgressions({ ...work, careerPaths: updatedPaths }), "Career path activated");
  }

  function confirmDeactivate() {
    if (!deactivating) return;
    const updatedPaths = paths.map((p) =>
      p.id === deactivating.id ? { ...p, status: "Inactive" as const } : p,
    );
    save(data, syncProgressions({ ...work, careerPaths: updatedPaths }), "Career path deactivated");
    setDeactivating(null);
  }

  function confirmDelete() {
    if (!deleting) return;
    const updatedPaths = paths.filter((p) => p.id !== deleting.id);
    save(data, syncProgressions({ ...work, careerPaths: updatedPaths }), "Career path deleted");
    setDeleting(null);
  }

  return (
    <section className="cm-card">
      <div className="cm-section-head">
        <div>
          <h2>Role progression</h2>
          <p>Configure career paths and progression thresholds for employee development.</p>
        </div>
        <button className="cm-button primary" onClick={() => begin()}>
          <Plus size={16} /> Create career path
        </button>
      </div>

      {paths.length === 0 ? (
        <div className="cm-empty">
          <Route size={28} />
          <h3>No career paths configured</h3>
          <p>Create a career path to define role progressions and help learners plan their growth.</p>
          <button className="cm-button" onClick={() => begin()}>
            Create your first career path
          </button>
        </div>
      ) : (
        <div className="cm-cp-list">
          {paths.map((path) => (
            <div
              key={path.id}
              className={`cm-cp-card${path.status === "Inactive" ? " inactive" : ""}`}
            >
              <div className="cm-cp-card-header">
                <div className="cm-cp-card-meta">
                  <strong className="cm-cp-card-name">{path.name}</strong>
                  <span className={`cm-badge${path.status === "Active" ? " active" : ""}`}>
                    {path.status}
                  </span>
                </div>
                <div className="cm-row-actions">
                  <button
                    className="cm-icon-button"
                    aria-label={`Edit ${path.name}`}
                    onClick={() => begin(path)}
                  >
                    <Pencil size={15} />
                  </button>
                  {path.status === "Active" ? (
                    <button
                      className="cm-icon-button"
                      aria-label={"Inactivate " + path.name}
                      title="Inactivate"
                      onClick={() => toggleStatus(path)}
                    >
                      <Ban size={16} />
                    </button>
                  ) : (
                    <button
                      className="cm-icon-button"
                      aria-label={"Activate " + path.name}
                      title="Activate"
                      onClick={() => toggleStatus(path)}
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  )}
                  <button
                    className="cm-icon-button danger"
                    aria-label={`Delete ${path.name}`}
                    onClick={() => setDeleting(path)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="cm-cp-chain">
                {path.roles.map((role, i) => (
                  <Fragment key={i}>
                    <div className="cm-cp-role">
                      <span className="cm-cp-role-num">{i + 1}</span>
                      <span className="cm-cp-role-name">{role}</span>
                    </div>
                    {i < path.roles.length - 1 && (
                      <div className="cm-cp-connector" aria-hidden="true">
                        <ChevronRight size={13} className="cm-cp-arrow" />
                        <span className="cm-cp-pct">{path.thresholds[i]}%</span>
                      </div>
                    )}
                  </Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {draft && (
        <Dialog open onOpenChange={(open) => { if (!open) setDraft(null); }}>
          <DialogContent className="cm-dialog cm-cp-dialog">
            <DialogHeader>
              <DialogTitle>
                {paths.some((p) => p.id === draft.id) ? "Edit" : "Create"} career path
              </DialogTitle>
              <DialogDescription>
                Define the role sequence and the completion threshold required for each transition.
              </DialogDescription>
            </DialogHeader>

            {errors.length > 0 && (
              <div className="cm-error" role="alert">
                {errors.map((e) => <div key={e}>{e}</div>)}
              </div>
            )}

            <label>
              <span className="cm-req-label">
                Career path name <span className="req">*</span>
              </span>
              <input
                autoFocus
                value={draft.name}
                placeholder="e.g. Project Management Track"
                onChange={(e) => { setDraft({ ...draft, name: e.target.value }); setErrors([]); }}
              />
            </label>

            <div className="cm-cp-builder">
              <p className="cm-cp-builder-label">Role sequence</p>
              {draft.roles.map((role, i) => (
                <Fragment key={i}>
                  <div className="cm-cp-builder-role-row">
                    <span className="cm-cp-builder-num">{i + 1}</span>
                    <select
                      aria-label={`Role ${i + 1}`}
                      value={role}
                      onChange={(e) => updateRole(i, e.target.value)}
                    >
                      <option value="">Select role</option>
                      {allRoles.map((r) => (
                        <option
                          key={r}
                          value={r}
                          disabled={draft.roles.some((x, j) => j !== i && x === r)}
                        >
                          {r}
                        </option>
                      ))}
                    </select>
                    {draft.roles.length > MIN_ROLES && (
                      <button
                        type="button"
                        className="cm-icon-button"
                        aria-label={`Remove role ${i + 1}`}
                        onClick={() => removeRole(i)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  {i < draft.roles.length - 1 && (
                    <div className="cm-cp-builder-transition">
                      <span className="cm-cp-builder-line" aria-hidden="true" />
                      <div className="cm-cp-builder-threshold">
                        <label className="cm-cp-threshold-label">
                          <input
                            type="number"
                            min={1}
                            max={100}
                            aria-label={`Threshold from role ${i + 1} to role ${i + 2}`}
                            value={draft.thresholds[i]}
                            onChange={(e) => updateThreshold(i, e.target.value)}
                          />
                          <span>% completion required to advance</span>
                        </label>
                      </div>
                    </div>
                  )}
                </Fragment>
              ))}

              {draft.roles.length < MAX_ROLES ? (
                <button type="button" className="cm-cp-add-role-btn" onClick={addRole}>
                  <Plus size={13} /> Add next role
                </button>
              ) : (
                <p className="cm-field-hint" style={{ marginTop: 8 }}>
                  Maximum of {MAX_ROLES} roles reached.
                </p>
              )}
            </div>

            <div className="cm-dialog-actions">
              <button className="cm-button" onClick={() => setDraft(null)}>Cancel</button>
              <button className="cm-button primary" onClick={savePath}>Save career path</button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Deactivate confirmation */}
      {deactivating && (
        <Dialog open onOpenChange={(open) => { if (!open) setDeactivating(null); }}>
          <DialogContent className="cm-dialog">
            <DialogHeader>
              <DialogTitle>
                {careerPathIsProtected(deactivating)
                  ? `${deactivating.name} is assigned to learners or progress exists, so it cannot be deactivated.`
                  : `Are you sure you want to deactivate ${deactivating.name}?`}
              </DialogTitle>
            </DialogHeader>
            <div className="cm-dialog-actions">
              <button className="cm-button" onClick={() => setDeactivating(null)}>Cancel</button>
              {!careerPathIsProtected(deactivating) && (
                <button className="cm-button destructive" onClick={confirmDeactivate}>Deactivate</button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirmation */}
      {deleting && (
        <Dialog open onOpenChange={(open) => { if (!open) setDeleting(null); }}>
          <DialogContent className="cm-dialog">
            <DialogHeader>
              <DialogTitle>
                {careerPathIsProtected(deleting)
                  ? `${deleting.name} is assigned to learners or progress exists, so it cannot be deleted.`
                  : `Are you sure you want to delete ${deleting.name}?`}
              </DialogTitle>
            </DialogHeader>
            <div className="cm-dialog-actions">
              <button className="cm-button" onClick={() => setDeleting(null)}>Cancel</button>
              {!careerPathIsProtected(deleting) && (
                <button className="cm-button destructive" onClick={confirmDelete}>Delete</button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
