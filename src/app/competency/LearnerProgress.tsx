import { Fragment, useState, useEffect } from "react";
import { Download, Search, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { Data, Assignment, download } from "./model";
import { WorkflowData, updateCurrent } from "./workflowModel";

const personKey = (a: Assignment) => JSON.stringify([a.name, a.department]);

type GapStatus = "below" | "met" | "above" | "not-assessed" | "no-target";

function getGap(data: Data, a: Assignment): { status: GapStatus; gap: number | null } {
  const ci = data.levels.findIndex((l) => l.id === a.current);
  const ei = data.levels.findIndex((l) => l.id === a.expected);
  if (!a.current || ci < 0) return { status: "not-assessed", gap: null };
  if (!a.expected || ei < 0) return { status: "no-target", gap: null };
  if (ci > ei) return { status: "above", gap: ci - ei };
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [belowOnly, setBelowOnly] = useState<Record<string, boolean>>({});
  const [updateId, setUpdateId] = useState<string | null>(null);
  const [updatePos, setUpdatePos] = useState({ top: 0, right: 0 });
  const [pendingLevel, setPendingLevel] = useState("");

  useEffect(() => {
    if (!updateId) return;
    const onOutside = (e: MouseEvent) => {
      const el = document.querySelector(".cm-update-popover");
      if (el && !el.contains(e.target as Node)) setUpdateId(null);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [updateId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && updateId) setUpdateId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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

  function toggleExpand(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
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

  function expandAll() {
    setExpanded((prev) => {
      const next = new Set(prev);
      pageGroups.forEach(([key]) => next.add(key));
      return next;
    });
  }
  function collapseAll() {
    setExpanded((prev) => {
      const next = new Set(prev);
      pageGroups.forEach(([key]) => next.delete(key));
      return next;
    });
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

  return (
    <section className="cm-card">
      {/* Header */}
      <div className="cm-section-head">
        <div>
          <h2>Assignments &amp; progress</h2>
          <p>Expand one or more learners to compare and update proficiency levels.</p>
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
                      : g.status === "not-assessed" ? "Not assessed" : "No target",
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

      {/* Toolbar: search + expand controls */}
      <div className="cm-toolbar cm-lp-toolbar">
        <label className="cm-search cm-lp-search-field">
          <Search size={16} />
          <input
            aria-label="Search learners"
            placeholder="Search name, role, email, department…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
          />
        </label>
        <div className="cm-lp-expand-btns">
          <button className="cm-button" onClick={expandAll}>Expand all</button>
          <button className="cm-button" onClick={collapseAll}>Collapse all</button>
        </div>
      </div>

      {/* Main table */}
      <div className="cm-table-wrap">
        <table>
          <thead>
            <tr>
              <th className="cm-exp-col"></th>
              <th>Learner</th>
              <th>Role</th>
              <th>Assigned skills</th>
              <th>Skill gaps</th>
            </tr>
          </thead>
          <tbody>
            {pageGroups.map(([key, items]) => {
              const isOpen = expanded.has(key);
              const emp = empFor(items[0]);
              const gap = rowGapSummary(items);
              const isBelowOnly = belowOnly[key] ?? false;
              const visibleItems = items.filter(
                (a) => !isBelowOnly || getGap(data, a).status === "below",
              );

              return (
                <Fragment key={key}>
                  {/* Learner summary row */}
                  <tr className={`cm-learner-row${isOpen ? " open" : ""}`}>
                    <td className="cm-exp-cell">
                      <button
                        className="cm-expand-toggle"
                        aria-expanded={isOpen}
                        aria-label={`${isOpen ? "Collapse" : "Expand"} skills for ${items[0].name}`}
                        onClick={() => toggleExpand(key)}
                      >
                        {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    </td>
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
                  </tr>

                  {/* Expanded skill table */}
                  {isOpen && (
                    <tr className="cm-learner-exp-row">
                      <td colSpan={5}>
                        <div className="cm-learner-exp">

                          {/* Summary + filter bar */}
                          <div className="cm-learner-exp-bar">
                            <span className="cm-learner-exp-summary">{buildSummary(items)}</span>
                            <label className="cm-lp-filter-toggle">
                              <input
                                type="checkbox"
                                checked={isBelowOnly}
                                onChange={(e) =>
                                  setBelowOnly((prev) => ({ ...prev, [key]: e.target.checked }))
                                }
                              />
                              Below target only
                            </label>
                          </div>

                          {/* Skill comparison table */}
                          <div className="cm-skill-cmp-scroll">
                            <table className="cm-skill-cmp-table">
                              <thead>
                                <tr>
                                  <th className="cm-sct-skill">Skill</th>
                                  <th className="cm-sct-cmp">
                                    <span className="cm-sct-cmp-label">Proficiency comparison</span>
                                    {n >= 2 && (
                                      <div
                                        className="cm-cmp-level-header"
                                        style={{ "--n": n } as React.CSSProperties}
                                      >
                                        {levels.map((l, i) => (
                                          <span
                                            key={l.id}
                                            className={`cm-cmp-lh-label${i === 0 ? " first" : i === n - 1 ? " last" : ""}`}
                                            style={{ "--i": i } as React.CSSProperties}
                                          >
                                            {l.name}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </th>
                                  <th className="cm-sct-gap">Gap / Status</th>
                                  <th className="cm-sct-action"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {visibleItems.map((a) => {
                                  const g = getGap(data, a);
                                  const ci = levels.findIndex((l) => l.id === a.current);
                                  const ei = levels.findIndex((l) => l.id === a.expected);
                                  const lastActiveIdx = levels.reduce(
                                    (max, l, i) => (l.status === "Active" ? i : max),
                                    -1,
                                  );
                                  const isAtMax = ci >= 0 && ci >= lastActiveIdx;

                                  let gapText = "—", gapCls = "";
                                  if (g.status === "below") {
                                    gapText = `${g.gap} level${g.gap !== 1 ? "s" : ""} below target`;
                                    gapCls = "below";
                                  } else if (g.status === "met") {
                                    gapText = "Target met";
                                    gapCls = "met";
                                  } else if (g.status === "above") {
                                    gapText = `${g.gap} level${g.gap !== 1 ? "s" : ""} above target`;
                                  } else if (g.status === "not-assessed") {
                                    gapText = "Not assessed";
                                    gapCls = "muted";
                                  } else if (g.status === "no-target") {
                                    gapText = "Target not set";
                                    gapCls = "muted";
                                  }

                                  return (
                                    <tr key={a.id} className="cm-skill-cmp-row">
                                      <td className="cm-sct-td-skill">
                                        <strong>{skillOf(a)?.name || "—"}</strong>
                                        <span className="cm-lp-skill-comp">{compOf(a)}</span>
                                      </td>
                                      <td className="cm-sct-td-cmp">
                                        <span className="cm-cmp-text">
                                          Current:{" "}
                                          <strong>{a.current ? lvlName(a.current) : "—"}</strong>
                                          {"  ·  "}
                                          Target:{" "}
                                          <strong>{a.expected ? lvlName(a.expected) : "—"}</strong>
                                        </span>
                                        {n >= 2 && (
                                          <div
                                            className="cm-cmp-track"
                                            style={{
                                              "--n": n,
                                              "--cur": ci,
                                              "--exp": ei,
                                            } as React.CSSProperties}
                                          >
                                            <div className="cm-cmp-rail" />
                                            {ci >= 0 && <div className="cm-cmp-fill" />}
                                            {ci >= 0 && ei > ci && <div className="cm-cmp-dash" />}
                                            {levels.map((level, i) => {
                                              const dc = dotClass(i, ci, ei);
                                              return (
                                                <div
                                                  key={level.id}
                                                  className={`cm-cmp-dot ${dc}`}
                                                  style={{ "--i": i } as React.CSSProperties}
                                                  title={level.name}
                                                >
                                                  {dc === "target" && <span aria-hidden>★</span>}
                                                  {dc === "achieved" && <CheckCircle2 size={9} />}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </td>
                                      <td className="cm-sct-td-gap">
                                        <span
                                          className={`cm-lp-gap-status${gapCls ? " " + gapCls : ""}`}
                                        >
                                          {gapText}
                                        </span>
                                      </td>
                                      <td className="cm-sct-td-action">
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
                                  );
                                })}
                                {visibleItems.length === 0 && (
                                  <tr>
                                    <td colSpan={4} className="cm-empty">
                                      {isBelowOnly
                                        ? "No skills are currently below target."
                                        : "No skills assigned."}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Legend */}
                          <div className="cm-cmp-legend">
                            <span className="cm-cmp-legend-item">
                              <span className="cm-cmp-legend-dot current" />
                              Current level
                            </span>
                            <span className="cm-cmp-legend-item">
                              <span className="cm-cmp-legend-dot target">★</span>
                              Target level
                            </span>
                            <span className="cm-cmp-legend-item">
                              <span className="cm-cmp-legend-dash" />
                              Gap
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
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

      {/* Pagination */}
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

      {/* Update popover */}
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
