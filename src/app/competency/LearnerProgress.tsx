import { Fragment, useRef, useState, useEffect, useCallback } from "react";
import { Download, Search, X, CheckCircle2 } from "lucide-react";
import { Data, Assignment, download } from "./model";
import { WorkflowData, updateCurrent } from "./workflowModel";

const personKey = (a: Assignment) => JSON.stringify([a.name, a.department]);

type GapStatus = "below" | "met" | "above" | "not-assessed" | "no-target";
function getGap(data: Data, a: Assignment): { status: GapStatus; gap: number | null } {
  const ci = data.levels.findIndex((l) => l.id === a.current);
  const ei = data.levels.findIndex((l) => l.id === a.expected);
  if (!a.current || ci < 0) return { status: "not-assessed", gap: null };
  if (!a.expected || ei < 0) return { status: "no-target", gap: null };
  if (ci > ei) return { status: "above", gap: 0 };
  if (ci === ei) return { status: "met", gap: 0 };
  return { status: "below", gap: ei - ci };
}

export function LearnerProgress({
  data,
  work,
  save,
}: {
  data: Data;
  work: WorkflowData;
  save: (data: Data, work: WorkflowData, message: string) => boolean;
}) {
  const levels = data.levels;
  const n = levels.length;

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [panelKey, setPanelKey] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [updateId, setUpdateId] = useState<string | null>(null);
  const [updatePos, setUpdatePos] = useState({ top: 0, right: 0 });
  const [pendingLevel, setPendingLevel] = useState("");
  const [belowOnly, setBelowOnly] = useState(false);

  const viewBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const closePanel = useCallback(() => {
    const key = panelKey;
    setPanelKey(null);
    setDetailId(null);
    setBelowOnly(false);
    setTimeout(() => key && viewBtnRefs.current[key]?.focus(), 50);
  }, [panelKey]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (updateId) { setUpdateId(null); return; }
      if (panelKey) closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [updateId, panelKey, closePanel]);

  useEffect(() => {
    if (!updateId) return;
    const onOutside = (e: MouseEvent) => {
      const el = document.querySelector(".cm-update-popover");
      if (el && !el.contains(e.target as Node)) setUpdateId(null);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [updateId]);

  // Group assignments by person
  const allGroups = new Map<string, Assignment[]>();
  for (const a of data.assignments) {
    const k = personKey(a);
    if (!allGroups.has(k)) allGroups.set(k, []);
    allGroups.get(k)!.push(a);
  }

  const skillOf = (a: Assignment) => data.skills.find((s) => s.id === a.skillId);
  const compOf = (a: Assignment) =>
    data.competencies.find((c) => c.id === skillOf(a)?.competencyId)?.name || "Uncategorized";
  const lvlName = (id: string) =>
    id ? data.levels.find((l) => l.id === id)?.name || "—" : "—";
  const empFor = (a: Assignment) =>
    work.employees.find(
      (e) => e.id === a.employeeId || (e.name === a.name && e.department === a.department),
    );

  function rowGapSummary(items: Assignment[]) {
    const below = items.filter((a) => getGap(data, a).status === "below").length;
    const notAssessed = items.filter((a) => getGap(data, a).status === "not-assessed").length;
    const noTarget = items.filter((a) => getGap(data, a).status === "no-target").length;
    const allPositive = items.every((a) => {
      const s = getGap(data, a).status;
      return s === "met" || s === "above";
    });
    if (below > 0) return { text: `${below} below target`, cls: "below" };
    if (notAssessed > 0) return { text: `${notAssessed} not assessed`, cls: "" };
    if (noTarget > 0) return { text: `${noTarget} no target set`, cls: "" };
    if (allPositive) return { text: "All targets met", cls: "met" };
    return { text: "—", cls: "" };
  }

  function buildSummary(items: Assignment[]) {
    const below = items.filter((a) => getGap(data, a).status === "below").length;
    const metOrAbove = items.filter((a) => {
      const s = getGap(data, a).status;
      return s === "met" || s === "above";
    }).length;
    const notAssessed = items.filter((a) => getGap(data, a).status === "not-assessed").length;
    const noTarget = items.filter((a) => getGap(data, a).status === "no-target").length;
    return [
      `${items.length} skill${items.length !== 1 ? "s" : ""}`,
      below ? `${below} below target` : null,
      metOrAbove ? `${metOrAbove} target${metOrAbove !== 1 ? "s" : ""} met` : null,
      notAssessed ? `${notAssessed} not assessed` : null,
      noTarget ? `${noTarget} no target set` : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  function openUpdate(e: React.MouseEvent<HTMLButtonElement>, a: Assignment) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setUpdatePos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    setUpdateId(a.id);
    setPendingLevel(a.current || "");
  }

  function doSave() {
    if (!updateId) return;
    const a = data.assignments.find((x) => x.id === updateId);
    if (!a || !pendingLevel) return;
    const ci = levels.findIndex((l) => l.id === a.current);
    const ni = levels.findIndex((l) => l.id === pendingLevel);
    if (ci >= 0 && ni <= ci) return;
    const next = updateCurrent(data, work, a.id, pendingLevel, "Admin");
    if (save(next.data, next.work, `Updated ${a.name}: ${skillOf(a)?.name}`)) {
      setUpdateId(null);
    }
  }

  function dotClass(i: number, ci: number, ei: number) {
    if (ci >= 0 && i === ci && i === ei) return "achieved";
    if (ci >= 0 && i === ci) return "current";
    if (i === ei) return "target";
    if (ci >= 0 && i < ci) return "done";
    if (ei >= 0 && i > ei) return "beyond";
    return "empty";
  }

  // Filter and paginate
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

  const panelAllItems = panelKey ? allGroups.get(panelKey) || [] : [];
  const panelItems = panelAllItems.filter(
    (a) => !belowOnly || getGap(data, a).status === "below",
  );

  return (
    <section className="cm-card">
      <div className="cm-section-head">
        <div>
          <h2>Assignments &amp; progress</h2>
          <p>Click "View skills" to review and update a learner's proficiency levels.</p>
        </div>
        <div className="cm-actions">
          <button
            className="cm-button"
            onClick={() =>
              download("learner-progress.csv", [
                [
                  "Learner", "Role", "Email", "Department", "Competency",
                  "Skill", "Current level", "Expected level", "Skill gap", "Status",
                ],
                ...data.assignments.map((a) => {
                  const emp = empFor(a);
                  const g = getGap(data, a);
                  return [
                    a.name, emp?.role ?? "", emp?.email ?? "", a.department,
                    compOf(a), skillOf(a)?.name || "",
                    lvlName(a.current), lvlName(a.expected),
                    g.gap != null
                      ? String(g.gap)
                      : g.status === "not-assessed"
                        ? "Not assessed"
                        : "No target",
                    g.status,
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
              <th>Assigned skills</th>
              <th>Skill gaps</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pageGroups.map(([key, items]) => {
              const emp = empFor(items[0]);
              const gap = rowGapSummary(items);
              return (
                <tr key={key} className="cm-learner-row">
                  <td>
                    <strong>{items[0].name}</strong>
                    <small>{items[0].department}</small>
                  </td>
                  <td>{emp?.role || <span className="cm-muted-dash">—</span>}</td>
                  <td>
                    <span className="cm-skill-count-badge">
                      {items.length} skill{items.length !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td>
                    <span className={`cm-gap-summary${gap.cls ? " " + gap.cls : ""}`}>
                      {gap.cls === "below" && <span className="cm-gap-summary-dot" aria-hidden />}
                      {gap.cls === "met" && <span className="cm-gap-summary-check" aria-hidden>✓</span>}
                      {gap.text}
                    </span>
                  </td>
                  <td className="cm-right">
                    <button
                      className="cm-button"
                      ref={(el) => { viewBtnRefs.current[key] = el; }}
                      onClick={() => { setPanelKey(key); setDetailId(null); setBelowOnly(false); }}
                    >
                      View skills
                    </button>
                  </td>
                </tr>
              );
            })}
            {!total && (
              <tr>
                <td colSpan={5} className="cm-empty">No learners match your search.</td>
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
          <button
            className="cm-button"
            disabled={(currentPage + 1) * PAGE_SIZE >= total}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* ── Side panel ── */}
      {panelKey && (() => {
        const allItems = allGroups.get(panelKey)!;
        const emp = empFor(allItems[0]);
        const summary = buildSummary(allItems);
        return (
          <>
            <div className="cm-lp-overlay" onClick={closePanel} />
            <aside
              className="cm-lp-panel"
              role="dialog"
              aria-modal="true"
              aria-label={`Skills for ${allItems[0].name}`}
            >
              <div className="cm-lp-panel-header">
                <div className="cm-lp-panel-heading">
                  <h2>{allItems[0].name}</h2>
                  <span>
                    {[emp?.role, allItems[0].department, emp?.email]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
                <button className="cm-lp-close" aria-label="Close panel" onClick={closePanel}>
                  <X size={20} />
                </button>
              </div>

              <div className="cm-lp-summary">{summary}</div>

              <div className="cm-lp-toolbar">
                <label className="cm-lp-filter-toggle">
                  <input
                    type="checkbox"
                    checked={belowOnly}
                    onChange={(e) => setBelowOnly(e.target.checked)}
                  />
                  Below target only
                </label>
              </div>

              <div className="cm-lp-body">
                <table className="cm-lp-skill-table">
                  <thead>
                    <tr>
                      <th>Skill</th>
                      <th>Current</th>
                      <th>Target</th>
                      <th>Gap</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {panelItems.map((a) => {
                      const g = getGap(data, a);
                      const ci = levels.findIndex((l) => l.id === a.current);
                      const ei = levels.findIndex((l) => l.id === a.expected);
                      const lastActiveIdx = levels.reduce(
                        (max, l, i) => (l.status === "Active" ? i : max),
                        -1,
                      );
                      const isAtMax = ci >= 0 && ci >= lastActiveIdx;
                      const isOpen = detailId === a.id;

                      let gapText = "—";
                      let gapCls = "";
                      if (g.status === "below") {
                        gapText = `${g.gap} level${g.gap !== 1 ? "s" : ""} below`;
                        gapCls = "below";
                      } else if (g.status === "met") {
                        gapText = "Target met";
                        gapCls = "met";
                      } else if (g.status === "above") {
                        gapText = "Above target";
                      } else if (g.status === "not-assessed") {
                        gapText = "Not assessed";
                        gapCls = "muted";
                      } else if (g.status === "no-target") {
                        gapText = "No target set";
                        gapCls = "muted";
                      }

                      return (
                        <Fragment key={a.id}>
                          <tr className={`cm-lp-skill-row${isOpen ? " open" : ""}`}>
                            <td>
                              <button
                                className="cm-lp-skill-name"
                                onClick={() => setDetailId(isOpen ? null : a.id)}
                                aria-expanded={isOpen}
                              >
                                {skillOf(a)?.name || "—"}
                              </button>
                              <span className="cm-lp-skill-comp">{compOf(a)}</span>
                            </td>
                            <td className="cm-lp-cell-level">
                              {a.current
                                ? lvlName(a.current)
                                : <span className="cm-lp-muted">Not assessed</span>}
                            </td>
                            <td className="cm-lp-cell-level">
                              {a.expected
                                ? lvlName(a.expected)
                                : <span className="cm-lp-muted">Not set</span>}
                            </td>
                            <td>
                              <span className={`cm-lp-gap-status${gapCls ? " " + gapCls : ""}`}>
                                {gapText}
                              </span>
                            </td>
                            <td className="cm-right">
                              {isAtMax ? (
                                <span className="cm-lp-at-max">Highest level</span>
                              ) : (
                                <button
                                  className="cm-button cm-lp-update-btn"
                                  onClick={(e) => openUpdate(e, a)}
                                >
                                  Update
                                </button>
                              )}
                            </td>
                          </tr>

                          {isOpen && (
                            <tr className="cm-lp-detail-row">
                              <td colSpan={5}>
                                <div className="cm-lp-detail">
                                  <div className="cm-lp-detail-meta">
                                    <span>
                                      <em>Current</em>
                                      {a.current ? lvlName(a.current) : "Not assessed"}
                                    </span>
                                    <span>
                                      <em>Target</em>
                                      {a.expected ? lvlName(a.expected) : "Not set"}
                                    </span>
                                    <span className={`cm-lp-gap-status${gapCls ? " " + gapCls : ""}`}>
                                      {gapText}
                                    </span>
                                  </div>
                                  {n >= 2 && (
                                    <div className="cm-lp-scale">
                                      <div
                                        className="cm-gap-track"
                                        style={{
                                          "--n": n,
                                          "--cur": ci,
                                          "--exp": ei,
                                        } as React.CSSProperties}
                                      >
                                        <div className="cm-gap-rail" />
                                        {ci >= 0 && <div className="cm-gap-fill" />}
                                        {ci >= 0 && ei > ci && <div className="cm-gap-dash" />}
                                        {levels.map((level, i) => {
                                          const dc = dotClass(i, ci, ei);
                                          return (
                                            <div
                                              key={level.id}
                                              className={`cm-gap-dot ${dc}${i === 0 ? " first" : i === n - 1 ? " last" : ""}`}
                                              style={{ "--i": i } as React.CSSProperties}
                                              title={level.name}
                                            >
                                              {dc === "target" && <span aria-hidden>★</span>}
                                              {dc === "achieved" && <CheckCircle2 size={11} />}
                                              <span className="cm-gap-label">{level.name}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                    {panelItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="cm-empty">
                          {belowOnly
                            ? "No skills are currently below target."
                            : "No skills assigned."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </aside>
          </>
        );
      })()}

      {/* ── Update popover ── */}
      {updateId && (() => {
        const a = data.assignments.find((x) => x.id === updateId);
        if (!a) return null;
        const ci = levels.findIndex((l) => l.id === a.current);
        const ni = levels.findIndex((l) => l.id === pendingLevel);
        const canSave = !!pendingLevel && (ci < 0 ? ni >= 0 : ni > ci);
        return (
          <div
            className="cm-update-popover"
            style={{ top: updatePos.top, right: updatePos.right }}
            role="dialog"
            aria-label="Update proficiency level"
          >
            <p className="cm-update-popover-skill">{skillOf(a)?.name}</p>
            <div className="cm-update-popover-field">
              <span className="cm-update-popover-label">Current level</span>
              <span className="cm-update-popover-value">
                {a.current ? lvlName(a.current) : <em>Not assessed</em>}
              </span>
            </div>
            <div className="cm-update-popover-field">
              <label className="cm-update-popover-label" htmlFor="cm-new-level">
                New level
              </label>
              <select
                id="cm-new-level"
                className="cm-level-inline-select"
                value={pendingLevel}
                onChange={(e) => setPendingLevel(e.target.value)}
              >
                {!a.current && <option value="" disabled>Select a level</option>}
                {levels
                  .filter((l) => l.status === "Active" || l.id === a.current)
                  .map((l) => {
                    const li = levels.findIndex((x) => x.id === l.id);
                    const disabled = ci >= 0 && li <= ci;
                    return (
                      <option key={l.id} value={l.id} disabled={disabled}>
                        {l.name}{li === ci ? " (current)" : ""}
                      </option>
                    );
                  })}
              </select>
            </div>
            <p className="cm-update-popover-hint">Proficiency can only increase</p>
            <div className="cm-update-popover-actions">
              <button className="cm-button" onClick={() => setUpdateId(null)}>Cancel</button>
              <button className="cm-button primary" disabled={!canSave} onClick={doSave}>
                Save
              </button>
            </div>
          </div>
        );
      })()}
    </section>
  );
}
