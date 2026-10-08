import { useState } from "react";
import { Data, progress, download } from "./model";
import { WorkflowData } from "./workflowModel";
import { levelName, employeeFor, skillGap } from "./managerModel";
import { ManagerPageSize, ManagerPagination } from "./ManagerPagination";
import { Search, Download, X } from "lucide-react";

export function LearnerSkillReport({
  data,
  work,
}: {
  data: Data;
  work: WorkflowData;
}) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRole] = useState("");
  const [deptFilter, setDept] = useState("");
  const [statusFilter, setStatus] = useState("");
  const [enrollFrom, setEnrollFrom] = useState("");
  const [enrollTo, setEnrollTo] = useState("");
  const [completeFrom, setCompleteFrom] = useState("");
  const [completeTo, setCompleteTo] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const allRoles = [...new Set(work.employees.map((e) => e.role).filter(Boolean))].sort();
  const allDepts = [...new Set(data.assignments.map((a) => a.department).filter(Boolean))].sort();

  const skillName = (id: string) =>
    data.skills.find((s) => s.id === id)?.name || "Unavailable skill";

  const rows = data.assignments.filter((a) => {
    const emp = employeeFor(work, a);
    const q = query.trim().toLowerCase();
    const assignedDay = a.assignedDate?.slice(0, 10) || "";
    const completedDay = a.completedDate?.slice(0, 10) || "";
    return (
      (!q ||
        skillName(a.skillId).toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.department.toLowerCase().includes(q)) &&
      (!roleFilter || emp?.role === roleFilter) &&
      (!deptFilter || a.department === deptFilter) &&
      (!statusFilter || progress(data, a) === statusFilter) &&
      (!enrollFrom || assignedDay >= enrollFrom) &&
      (!enrollTo || assignedDay <= enrollTo) &&
      (!completeFrom || completedDay >= completeFrom) &&
      (!completeTo || completedDay <= completeTo)
    );
  });

  const current = Math.min(page, Math.max(0, Math.ceil(rows.length / size) - 1));

  function reset() {
    setQuery(""); setRole(""); setDept(""); setStatus("");
    setEnrollFrom(""); setEnrollTo(""); setCompleteFrom(""); setCompleteTo("");
    setPage(0);
  }

  const hasFilter =
    query || roleFilter || deptFilter || statusFilter ||
    enrollFrom || enrollTo || completeFrom || completeTo;

  return (
    <section className="cm-card">
      <div className="cm-section-head">
        <div>
          <h2>Skill progress report</h2>
          <p>Track assigned skills and progress towards expected levels across all learners.</p>
        </div>
        <button
          className="cm-button"
          onClick={() =>
            download("skill-progress-report.csv", [
              ["Learner", "Role", "Department", "Assigned skill", "Current level", "Expected level", "Skill gap", "Enrol date", "Completed date", "Status"],
              ...rows.map((a) => {
                const emp = employeeFor(work, a);
                const gap = skillGap(data, a);
                return [
                  a.name, emp?.role || "", a.department, skillName(a.skillId),
                  levelName(data, a.current), levelName(data, a.expected),
                  gap != null ? String(gap) : "Not assessed",
                  a.assignedDate?.slice(0, 10) || "",
                  a.completedDate?.slice(0, 10) || "",
                  progress(data, a),
                ];
              }),
            ])
          }
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Filter area */}
      <div className="cm-rf-area">
        {/* Search */}
        <label className="cm-search cm-rf-search">
          <Search size={15} />
          <input
            aria-label="Search skill or learner"
            placeholder="Search skill name, learner, or department…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
          />
          {query && (
            <button type="button" className="cm-rf-clear-input" aria-label="Clear search" onClick={() => { setQuery(""); setPage(0); }}>
              <X size={13} />
            </button>
          )}
        </label>

        {/* Filter controls */}
        <div className="cm-rf-controls">
          <select
            aria-label="Filter by role"
            value={roleFilter}
            className={`cm-rf-select${roleFilter ? " active" : ""}`}
            onChange={(e) => { setRole(e.target.value); setPage(0); }}
          >
            <option value="">All roles</option>
            {allRoles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>

          <select
            aria-label="Filter by department"
            value={deptFilter}
            className={`cm-rf-select${deptFilter ? " active" : ""}`}
            onChange={(e) => { setDept(e.target.value); setPage(0); }}
          >
            <option value="">All departments</option>
            {allDepts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            className={`cm-rf-select${statusFilter ? " active" : ""}`}
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
          >
            <option value="">All statuses</option>
            {["Completed", "In Progress", "Yet to Start"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <div className="cm-rf-date-group">
            <span className="cm-rf-date-label">Enrol date</span>
            <div className={`cm-rf-date-range${enrollFrom || enrollTo ? " active" : ""}`}>
              <input
                type="date"
                aria-label="Enrol from"
                value={enrollFrom}
                onChange={(e) => { setEnrollFrom(e.target.value); setPage(0); }}
              />
              <span>–</span>
              <input
                type="date"
                aria-label="Enrol to"
                value={enrollTo}
                onChange={(e) => { setEnrollTo(e.target.value); setPage(0); }}
              />
              {(enrollFrom || enrollTo) && (
                <button
                  type="button"
                  className="cm-rf-date-clear"
                  aria-label="Clear enrol date filter"
                  onClick={() => { setEnrollFrom(""); setEnrollTo(""); setPage(0); }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="cm-rf-date-group">
            <span className="cm-rf-date-label">Completed</span>
            <div className={`cm-rf-date-range${completeFrom || completeTo ? " active" : ""}`}>
              <input
                type="date"
                aria-label="Completed from"
                value={completeFrom}
                onChange={(e) => { setCompleteFrom(e.target.value); setPage(0); }}
              />
              <span>–</span>
              <input
                type="date"
                aria-label="Completed to"
                value={completeTo}
                onChange={(e) => { setCompleteTo(e.target.value); setPage(0); }}
              />
              {(completeFrom || completeTo) && (
                <button
                  type="button"
                  className="cm-rf-date-clear"
                  aria-label="Clear completed date filter"
                  onClick={() => { setCompleteFrom(""); setCompleteTo(""); setPage(0); }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {hasFilter && (
            <button className="cm-rf-reset" onClick={reset}>
              <X size={13} /> Clear all
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {hasFilter && (
          <div className="cm-rf-chips">
            <span className="cm-rf-chips-label">Filtered:</span>
            {query && (
              <span className="cm-rf-chip">
                "{query}"
                <button aria-label="Remove search filter" onClick={() => { setQuery(""); setPage(0); }}><X size={11} /></button>
              </span>
            )}
            {roleFilter && (
              <span className="cm-rf-chip">
                {roleFilter}
                <button aria-label={`Remove role filter`} onClick={() => { setRole(""); setPage(0); }}><X size={11} /></button>
              </span>
            )}
            {deptFilter && (
              <span className="cm-rf-chip">
                {deptFilter}
                <button aria-label={`Remove department filter`} onClick={() => { setDept(""); setPage(0); }}><X size={11} /></button>
              </span>
            )}
            {statusFilter && (
              <span className={`cm-rf-chip ${statusFilter === "Completed" ? "success" : statusFilter === "In Progress" ? "warn" : ""}`}>
                {statusFilter}
                <button aria-label={`Remove status filter`} onClick={() => { setStatus(""); setPage(0); }}><X size={11} /></button>
              </span>
            )}
            {(enrollFrom || enrollTo) && (
              <span className="cm-rf-chip">
                Enrol: {enrollFrom || "any"} – {enrollTo || "any"}
                <button aria-label="Remove enrol date filter" onClick={() => { setEnrollFrom(""); setEnrollTo(""); setPage(0); }}><X size={11} /></button>
              </span>
            )}
            {(completeFrom || completeTo) && (
              <span className="cm-rf-chip">
                Completed: {completeFrom || "any"} – {completeTo || "any"}
                <button aria-label="Remove completed date filter" onClick={() => { setCompleteFrom(""); setCompleteTo(""); setPage(0); }}><X size={11} /></button>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="cm-table-controls">
        <ManagerPageSize value={size} onChange={(v) => { setSize(v); setPage(0); }} />
        <span className="cm-table-count">{rows.length} record{rows.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="cm-table-wrap" role="region" aria-label="Skill progress report" tabIndex={0}>
        <table>
          <thead>
            <tr>
              {["Learner", "Role", "Department", "Assigned skill", "Current level", "Expected level", "Skill gap", "Enrol date", "Completed date", "Status"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(current * size, (current + 1) * size).map((a) => {
              const emp = employeeFor(work, a);
              const gap = skillGap(data, a);
              return (
                <tr key={a.id}>
                  <td><strong>{a.name}</strong></td>
                  <td>{emp?.role || <span className="cm-muted-dash">—</span>}</td>
                  <td>{a.department || <span className="cm-muted-dash">—</span>}</td>
                  <td><strong>{skillName(a.skillId)}</strong></td>
                  <td>{levelName(data, a.current)}</td>
                  <td>{levelName(data, a.expected)}</td>
                  <td>
                    {gap != null ? gap : (
                      <span className="cm-muted-dash" title="Current level needed to calculate gap">—</span>
                    )}
                  </td>
                  <td>{a.assignedDate?.slice(0, 10) || <span className="cm-muted-dash">—</span>}</td>
                  <td>{a.completedDate?.slice(0, 10) || <span className="cm-muted-dash">—</span>}</td>
                  <td>
                    <span className={`cm-manager-status ${progress(data, a) === "Completed" ? "success" : progress(data, a) === "In Progress" ? "pending" : ""}`}>
                      {progress(data, a)}
                    </span>
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={10} className="cm-empty">
                  {hasFilter ? "No records match the active filters." : "No skill assignments found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ManagerPagination total={rows.length} page={current} pageSize={size} onPage={setPage} />
    </section>
  );
}
