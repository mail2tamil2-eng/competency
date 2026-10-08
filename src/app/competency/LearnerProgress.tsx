import { Fragment, useState } from "react";
import { Download, Search, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { Data, Assignment, download, progress } from "./model";
import { WorkflowData, updateCurrent } from "./workflowModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";

const personKey = (a: Assignment) => JSON.stringify([a.name, a.department]);

export function LearnerProgress({
  data,
  work,
  save,
}: {
  data: Data;
  work: WorkflowData;
  save: (data: Data, work: WorkflowData, message: string) => boolean;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dirtyLevels, setDirtyLevels] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState<{
    id: string;
    fromId: string;
    toId: string;
  } | null>(null);

  const skill = (a: Assignment) => data.skills.find((s) => s.id === a.skillId);
  const competency = (a: Assignment) =>
    data.competencies.find((c) => c.id === skill(a)?.competencyId)?.name || "Uncategorized";
  const levelName = (id: string) =>
    id ? data.levels.find((l) => l.id === id)?.name || "Not recorded" : "Not assessed";
  const empFor = (a: Assignment) =>
    work.employees.find(
      (e) => e.id === a.employeeId || (e.name === a.name && e.department === a.department),
    );

  const allGroups = new Map<string, Assignment[]>();
  for (const a of data.assignments) {
    const k = personKey(a);
    if (!allGroups.has(k)) allGroups.set(k, []);
    allGroups.get(k)!.push(a);
  }

  const filteredGroups = [...allGroups.entries()].filter(([, items]) => {
    const emp = empFor(items[0]);
    return `${items[0].name} ${items[0].department} ${emp?.role ?? ""} ${emp?.email ?? ""}`
      .toLowerCase()
      .includes(query.trim().toLowerCase());
  });

  const PAGE_SIZE = 10;
  const total = filteredGroups.length;
  const currentPage = Math.min(page, Math.max(0, Math.ceil(total / PAGE_SIZE) - 1));
  const pageGroups = filteredGroups.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  function toggleExpand(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function setDirty(id: string, val: string, original: string) {
    if (val === original) {
      setDirtyLevels((prev) => { const n = { ...prev }; delete n[id]; return n; });
    } else {
      setDirtyLevels((prev) => ({ ...prev, [id]: val }));
    }
  }

  function requestSave(a: Assignment) {
    const newLevel = dirtyLevels[a.id];
    if (newLevel === undefined) return;
    setConfirming({ id: a.id, fromId: a.current, toId: newLevel });
  }

  function confirmSave() {
    if (!confirming) return;
    const a = data.assignments.find((x) => x.id === confirming.id);
    if (!a) return;
    const next = updateCurrent(data, work, a.id, confirming.toId, "Admin");
    if (save(next.data, next.work, `Updated ${a.name}: ${skill(a)?.name}`)) {
      setDirtyLevels((prev) => { const n = { ...prev }; delete n[confirming.id]; return n; });
      setConfirming(null);
    }
  }

  function learnerSummary(items: Assignment[]) {
    const completed = items.filter((a) => progress(data, a) === "Completed").length;
    const pct = Math.round((completed / items.length) * 100);
    const status =
      completed === items.length ? "Completed"
      : items.some((a) => progress(data, a) === "In Progress") ? "In Progress"
      : "Yet to Start";
    return { completed, pct, status };
  }

  const levels = data.levels;
  const n = levels.length;

  return (
    <section className="cm-card">
      <div className="cm-section-head">
        <div>
          <h2>Assignments &amp; progress</h2>
          <p>View and update learner proficiency levels. Click a row to expand skills.</p>
        </div>
        <div className="cm-actions">
          <button
            className="cm-button"
            onClick={() =>
              download("learner-progress.csv", [
                ["Learner", "Role", "Email", "Department", "Competency", "Skill", "Current level", "Expected level", "Status"],
                ...data.assignments.map((a) => {
                  const emp = empFor(a);
                  return [
                    a.name, emp?.role ?? "", emp?.email ?? "", a.department,
                    competency(a), skill(a)?.name || "",
                    levelName(a.current), levelName(a.expected), progress(data, a),
                  ];
                }),
              ])
            }
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="cm-toolbar">
        <label className="cm-search">
          <Search size={16} />
          <input
            aria-label="Search learners"
            placeholder="Search name, role, email, department…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
          />
        </label>
      </div>

      <div className="cm-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Learner</th>
              <th>Role</th>
              <th>Email</th>
              <th>Skills</th>
              <th>Progress</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pageGroups.map(([key, items]) => {
              const emp = empFor(items[0]);
              const { pct, status } = learnerSummary(items);
              const isOpen = expanded.has(key);
              return (
                <Fragment key={key}>
                  <tr
                    className={`cm-learner-row${isOpen ? " cm-learner-row-open" : ""}`}
                    onClick={() => toggleExpand(key)}
                  >
                    <td>
                      <strong>{items[0].name}</strong>
                      <small>{items[0].department}</small>
                    </td>
                    <td>{emp?.role || <span className="cm-muted-dash">—</span>}</td>
                    <td>{emp?.email || <span className="cm-muted-dash">—</span>}</td>
                    <td>
                      <span className="cm-skill-count-badge">
                        {items.length} skill{items.length !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td>
                      <div className="cm-lp-progress">
                        <div className="cm-lp-bar">
                          <div style={{ width: pct + "%" }} />
                        </div>
                        <span className={`cm-badge ${status === "Completed" ? "active" : status === "In Progress" ? "draft" : ""}`}>
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td className="cm-right">
                      {isOpen ? <ChevronUp size={16} color="#526176" /> : <ChevronDown size={16} color="#526176" />}
                    </td>
                  </tr>

                  {isOpen && (
                    <tr className="cm-learner-detail-row">
                      <td colSpan={6} style={{ padding: 0 }}>
                        <div className="cm-learner-skills">

                          {/* Level legend header */}
                          <div className="cm-gap-legend-bar">
                            <span className="cm-gap-legend-item">
                              <span className="cm-gap-legend-dot done" />
                              Completed level
                            </span>
                            <span className="cm-gap-legend-item">
                              <span className="cm-gap-legend-dot current" />
                              Current level
                            </span>
                            <span className="cm-gap-legend-item">
                              <span className="cm-gap-legend-dot target" />★ Target level
                            </span>
                            <span className="cm-gap-legend-item">
                              <span className="cm-gap-legend-dot beyond" />
                              Beyond target
                            </span>
                          </div>

                          {items.map((a) => {
                            const isDirty = dirtyLevels[a.id] !== undefined;
                            const st = progress(data, a);
                            const currentIdx = levels.findIndex((l) => l.id === a.current);
                            const expectedIdx = levels.findIndex((l) => l.id === a.expected);
                            const gapCount = currentIdx >= 0 && expectedIdx > currentIdx ? expectedIdx - currentIdx : 0;

                            function dotClass(i: number) {
                              if (currentIdx >= 0 && i === currentIdx && i === expectedIdx) return "achieved";
                              if (currentIdx >= 0 && i === currentIdx) return "current";
                              if (i === expectedIdx) return "target";
                              if (currentIdx >= 0 && i < currentIdx) return "done";
                              if (expectedIdx >= 0 && i > expectedIdx) return "beyond";
                              return "empty";
                            }

                            return (
                              <div key={a.id} className={`cm-gap-skill-card${isDirty ? " dirty" : ""}`}>
                                {/* Card header */}
                                <div className="cm-gap-skill-header">
                                  <div className="cm-gap-skill-info">
                                    <strong>{skill(a)?.name}</strong>
                                    <span className="cm-category">{competency(a)}</span>
                                  </div>
                                  <div className="cm-gap-skill-meta">
                                    {gapCount > 0 && (
                                      <span className="cm-gap-chip">
                                        {gapCount} level{gapCount !== 1 ? "s" : ""} to go
                                      </span>
                                    )}
                                    {!a.current && (
                                      <span className="cm-gap-chip not-assessed">Not assessed</span>
                                    )}
                                    <span className={`cm-badge ${st === "Completed" ? "active" : st === "In Progress" ? "draft" : ""}`}>
                                      {st}
                                    </span>
                                  </div>
                                </div>

                                {/* Visual level track */}
                                <div className="cm-gap-track-wrap">
                                  {n >= 2 && (
                                    <div
                                      className="cm-gap-track"
                                      style={{ '--n': n, '--cur': currentIdx, '--exp': expectedIdx } as React.CSSProperties}
                                    >
                                      <div className="cm-gap-rail" />
                                      {currentIdx >= 0 && <div className="cm-gap-fill" />}
                                      {currentIdx >= 0 && expectedIdx > currentIdx && <div className="cm-gap-dash" />}
                                      {levels.map((level, i) => {
                                        const dc = dotClass(i);
                                        return (
                                          <div
                                            key={level.id}
                                            className={`cm-gap-dot ${dc}${i === 0 ? " first" : i === n - 1 ? " last" : ""}`}
                                            style={{ '--i': i } as React.CSSProperties}
                                            title={level.name}
                                          >
                                            {dc === "target" && <span aria-hidden>★</span>}
                                            {dc === "achieved" && <CheckCircle2 size={11} />}
                                            <span className="cm-gap-label">{level.name}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>

                                {/* Edit controls */}
                                <div className="cm-gap-edit" onClick={(e) => e.stopPropagation()}>
                                  <span className="cm-gap-edit-label">Update level</span>
                                  <select
                                    className="cm-level-inline-select"
                                    aria-label={`Current level for ${a.name} ${skill(a)?.name}`}
                                    value={dirtyLevels[a.id] ?? a.current}
                                    onChange={(e) => setDirty(a.id, e.target.value, a.current)}
                                  >
                                    <option value="">Not assessed</option>
                                    {levels
                                      .filter((l) => l.status === "Active" || l.id === a.current)
                                      .map((l) => {
                                        const lIdx = levels.findIndex((x) => x.id === l.id);
                                        const beyondExpected = expectedIdx >= 0 && lIdx > expectedIdx;
                                        const isDowngrade = a.current && currentIdx >= 0 && lIdx < currentIdx;
                                        return (
                                          <option key={l.id} value={l.id} disabled={beyondExpected || !!isDowngrade}>
                                            {l.name}
                                            {beyondExpected ? " (beyond target)" : isDowngrade ? " (completed)" : ""}
                                          </option>
                                        );
                                      })}
                                  </select>
                                  {isDirty && (
                                    <button
                                      className="cm-button primary cm-save-inline"
                                      onClick={() => requestSave(a)}
                                    >
                                      Save
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {!total && (
              <tr>
                <td colSpan={6} className="cm-empty">No learners match your search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="cm-pagination">
        <span>
          {total
            ? `${currentPage * PAGE_SIZE + 1}–${Math.min((currentPage + 1) * PAGE_SIZE, total)} of ${total}`
            : "0"}{" "}
          learners
        </span>
        <div>
          <button className="cm-button" disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>
            Previous
          </button>
          <button className="cm-button" disabled={(currentPage + 1) * PAGE_SIZE >= total} onClick={() => setPage(currentPage + 1)}>
            Next
          </button>
        </div>
      </div>

      {confirming && (() => {
        const a = data.assignments.find((x) => x.id === confirming.id);
        return (
          <Dialog open onOpenChange={(open) => { if (!open) setConfirming(null); }}>
            <DialogContent className="cm-dialog">
              <DialogHeader>
                <DialogTitle>Confirm level update</DialogTitle>
                <DialogDescription>
                  Update the current level from{" "}
                  <strong>{levelName(confirming.fromId) || "Not assessed"}</strong> to{" "}
                  <strong>{levelName(confirming.toId)}</strong> for{" "}
                  <strong>{skill(a!)?.name}</strong>?
                </DialogDescription>
              </DialogHeader>
              <div className="cm-dialog-actions">
                <button className="cm-button" onClick={() => setConfirming(null)}>Cancel</button>
                <button className="cm-button primary" onClick={confirmSave}>Update level</button>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
    </section>
  );
}
