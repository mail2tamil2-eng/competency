import { useState } from "react";
import { Data, progress, download } from "./model";
import { WorkflowData } from "./workflowModel";
import { levelName, employeeFor, skillGap } from "./managerModel";
import { ManagerPageSize, ManagerPagination } from "./ManagerPagination";
import { Search, Download } from "lucide-react";

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
    const assignedDay = a.assignedDate?.slice(0, 10) || "";
    const completedDay = a.completedDate?.slice(0, 10) || "";
    return (
      (!query || skillName(a.skillId).toLowerCase().includes(query.trim().toLowerCase())) &&
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

  const hasFilter = query || roleFilter || deptFilter || statusFilter || enrollFrom || enrollTo || completeFrom || completeTo;

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
                  a.name,
                  emp?.role || "",
                  a.department,
                  skillName(a.skillId),
                  levelName(data, a.current),
                  levelName(data, a.expected),
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

      <div className="cm-report-filters">
        <label className="cm-search">
          <Search size={15} />
          <input
            aria-label="Search skill"
            placeholder="Search skill name…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
          />
        </label>
        <label>
          Role
          <select value={roleFilter} onChange={(e) => { setRole(e.target.value); setPage(0); }}>
            <option value="">All roles</option>
            {allRoles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label>
          Department
          <select value={deptFilter} onChange={(e) => { setDept(e.target.value); setPage(0); }}>
            <option value="">All departments</option>
            {allDepts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
            <option value="">All statuses</option>
            {["Completed", "In Progress", "Yet to Start"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Enrol from
          <input type="date" value={enrollFrom} onChange={(e) => { setEnrollFrom(e.target.value); setPage(0); }} />
        </label>
        <label>
          Enrol to
          <input type="date" value={enrollTo} onChange={(e) => { setEnrollTo(e.target.value); setPage(0); }} />
        </label>
        <label>
          Completed from
          <input type="date" value={completeFrom} onChange={(e) => { setCompleteFrom(e.target.value); setPage(0); }} />
        </label>
        <label>
          Completed to
          <input type="date" value={completeTo} onChange={(e) => { setCompleteTo(e.target.value); setPage(0); }} />
        </label>
        {hasFilter && (
          <button className="cm-text-button" style={{ alignSelf: "flex-end", marginBottom: 2 }} onClick={reset}>
            Clear filters
          </button>
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
                  <td>
                    <strong>{a.name}</strong>
                  </td>
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
