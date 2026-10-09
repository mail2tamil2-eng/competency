import { useState } from "react";
import { Plus, Pencil, Power, PowerOff, Trash2, TrendingUp } from "lucide-react";
import { Data } from "./model";
import { WorkflowData, RoleProgression } from "./workflowModel";
import { uid } from "./model";
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

export function CareerProgressionConfig({ data, work, save }: Props) {
  const [draft, setDraft] = useState<RoleProgression | null>(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<RoleProgression | null>(null);

  const allRoles = [...new Set(work.employees.map((e) => e.role).filter(Boolean))].sort();

  function begin(rp?: RoleProgression) {
    setError("");
    setDraft(
      rp
        ? structuredClone(rp)
        : { id: uid(), currentRole: "", nextRole: "", threshold: 80, status: "Active" },
    );
  }

  function saveConfig() {
    if (!draft) return;
    if (!draft.currentRole.trim() || !draft.nextRole.trim()) {
      setError("Both Current Role and Next Role are required.");
      return;
    }
    if (draft.currentRole === draft.nextRole) {
      setError("Current Role and Next Role must be different.");
      return;
    }
    if (draft.threshold < 0 || draft.threshold > 100) {
      setError("Threshold must be between 0 and 100.");
      return;
    }
    const existing = (work.roleProgressions || []).some(
      (r) => r.id !== draft.id && r.currentRole === draft.currentRole && r.nextRole === draft.nextRole,
    );
    if (existing) {
      setError(`A progression from "${draft.currentRole}" to "${draft.nextRole}" already exists.`);
      return;
    }
    const list = work.roleProgressions || [];
    const isNew = !list.some((r) => r.id === draft.id);
    if (
      save(
        data,
        { ...work, roleProgressions: isNew ? [...list, draft] : list.map((r) => (r.id === draft.id ? draft : r)) },
        isNew ? "Role progression created" : "Role progression updated",
      )
    ) {
      setDraft(null);
    }
  }

  function toggleStatus(rp: RoleProgression) {
    save(
      data,
      { ...work, roleProgressions: (work.roleProgressions || []).map((r) => r.id === rp.id ? { ...r, status: r.status === "Active" ? "Inactive" : "Active" } : r) },
      "Role progression status updated",
    );
  }

  function deleteConfig() {
    if (!deleting) return;
    save(
      data,
      { ...work, roleProgressions: (work.roleProgressions || []).filter((r) => r.id !== deleting.id) },
      "Role progression deleted",
    );
    setDeleting(null);
  }

  const progressions = work.roleProgressions || [];

  return (
    <section className="cm-card">
      <div className="cm-section-head">
        <div>
          <h2>Role progression</h2>
          <p>Configure current → next role relationships and the completion threshold that triggers career recommendations.</p>
        </div>
        <button className="cm-button primary" onClick={() => begin()}>
          <Plus size={16} /> Add progression
        </button>
      </div>

      {progressions.length === 0 ? (
        <div className="cm-empty">
          <TrendingUp size={28} />
          <h3>No progressions configured</h3>
          <p>Define role progressions so learners can see their career path and recommended next-role skills.</p>
          <button className="cm-button" onClick={() => begin()}>Add your first progression</button>
        </div>
      ) : (
        <div className="cm-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Current role</th>
                <th>Next role</th>
                <th>Threshold</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {progressions.map((rp) => (
                <tr key={rp.id}>
                  <td><strong>{rp.currentRole}</strong></td>
                  <td>{rp.nextRole}</td>
                  <td>{rp.threshold}% current role completion</td>
                  <td><span className={`cm-badge ${rp.status === "Active" ? "active" : ""}`}>{rp.status}</span></td>
                  <td>
                    <div className="cm-row-actions">
                      <button
                        className="cm-icon-button"
                        aria-label={`Edit ${rp.currentRole} → ${rp.nextRole}`}
                        onClick={() => begin(rp)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="cm-icon-button"
                        aria-label={(rp.status === "Active" ? "Deactivate " : "Activate ") + rp.currentRole}
                        title={rp.status === "Active" ? "Deactivate" : "Activate"}
                        onClick={() => toggleStatus(rp)}
                      >
                        {rp.status === "Active" ? <PowerOff size={15} /> : <Power size={15} />}
                      </button>
                      <button
                        className="cm-icon-button danger"
                        aria-label={`Delete ${rp.currentRole} → ${rp.nextRole}`}
                        onClick={() => setDeleting(rp)}
                      >
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

      {draft && (
        <Dialog open onOpenChange={(open) => { if (!open) setDraft(null); }}>
          <DialogContent className="cm-dialog">
            <DialogHeader>
              <DialogTitle>{(work.roleProgressions || []).some((r) => r.id === draft.id) ? "Edit" : "Add"} role progression</DialogTitle>
              <DialogDescription>
                Define the current role, the next role a learner progresses toward, and the completion threshold that triggers recommendations.
              </DialogDescription>
            </DialogHeader>
            {error && <p className="cm-error" role="alert">{error}</p>}
            <label>
              <span className="cm-req-label">Current role <span className="req">*</span></span>
              {allRoles.length > 0 ? (
                <select
                  value={draft.currentRole}
                  onChange={(e) => { setDraft({ ...draft, currentRole: e.target.value }); setError(""); }}
                >
                  <option value="">Select current role</option>
                  {allRoles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              ) : (
                <input
                  placeholder="e.g. Junior Developer"
                  value={draft.currentRole}
                  onChange={(e) => { setDraft({ ...draft, currentRole: e.target.value }); setError(""); }}
                />
              )}
            </label>
            <label>
              <span className="cm-req-label">Next role <span className="req">*</span></span>
              {allRoles.length > 0 ? (
                <select
                  value={draft.nextRole}
                  onChange={(e) => { setDraft({ ...draft, nextRole: e.target.value }); setError(""); }}
                >
                  <option value="">Select next role</option>
                  {allRoles.filter((r) => r !== draft.currentRole).map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              ) : (
                <input
                  placeholder="e.g. Senior Developer"
                  value={draft.nextRole}
                  onChange={(e) => { setDraft({ ...draft, nextRole: e.target.value }); setError(""); }}
                />
              )}
            </label>
            <label>
              Progression threshold (%)
              <input
                type="number"
                min={0}
                max={100}
                value={draft.threshold}
                onChange={(e) => setDraft({ ...draft, threshold: Math.max(0, Math.min(100, Number(e.target.value))) })}
              />
              <small>Minimum current-role completion % before next-role learning is recommended.</small>
            </label>
            <div className="cm-dialog-actions">
              <button className="cm-button" onClick={() => setDraft(null)}>Cancel</button>
              <button className="cm-button primary" onClick={saveConfig}>Save progression</button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {deleting && (
        <Dialog open onOpenChange={(open) => { if (!open) setDeleting(null); }}>
          <DialogContent className="cm-dialog">
            <DialogHeader>
              <DialogTitle>Delete progression?</DialogTitle>
              <DialogDescription>
                Remove the {deleting.currentRole} → {deleting.nextRole} progression? Career recommendations based on this configuration will no longer be generated.
              </DialogDescription>
            </DialogHeader>
            <div className="cm-dialog-actions">
              <button className="cm-button" onClick={() => setDeleting(null)}>Keep it</button>
              <button className="cm-button destructive" onClick={deleteConfig}>Delete</button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
