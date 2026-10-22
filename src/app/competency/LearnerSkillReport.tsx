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
  const [statusFilter, setStatus] = useState("");
  const [enrollFrom, setEnrollFrom] = useState("");
  const [enrollTo, setEnrollTo] = useState("");
  const [completeFrom, setCompleteFrom] = useState("");
  const [completeTo, setCompleteTo] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const skillName = (id: string) =>
    data.skills.find((s) => s.id === id)?.name || "Unavailable skill";

  const rows = data.assignments.filter((a) => {
    const q = query.trim().toLowerCase();
    const assignedDay = a.assignedDate?.slice(0, 10) || "";
    const completedDay = a.completedDate?.slice(0, 10) || "";
    return (
      (!q || skillName(a.skillId).toLowerCase().includes(q)) &&
      (!statusFilter || progress(data, a) === statusFilter) &&
      (!enrollFrom || assignedDay >= enrollFrom) &&
      (!enrollTo || assignedDay <= enrollTo) &&
      (!completeFrom || completedDay >= completeFrom) &&
      (!completeTo || completedDay <= completeTo)
    );
  });

  const current = Math.min(page, Math.max(0, Math.ceil(rows.length / size) - 1));

  const hasFilter =
    query || statusFilter ||
    enrollFrom || enrollTo || completeFrom || completeTo;

  function reset() {
    setQuery(""); setStatus("");
    setEnrollFrom(""); setEnrollTo(""); setCompleteFrom(""); setCompleteTo("");
    setPage(0);
  }

  return (
    <section className="cm-card">
      <div className="cm-section-head">
        <div>
          <h2>Skill progress report</h2>
          <p>Track assigned skills and progress towards expected levels across all learners.</p>
        </div>
      </div>

      <div className="cm-report-filters" style={{ alignItems: "flex-end", gap: 12 }}>
        <span style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 180 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#526176", letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1 }}>Skill name</span>
          <label className="cm-search">
            <Search size={15} />
            <input
              aria-label="Search skill"
              placeholder="Search skill name…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            />
          </label>
        </span>

        <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#526176", letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1 }}>Status</span>
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
          >
            <option value="">All statuses</option>
            {["Completed", "In Progress", "Yet to Start"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </span>

        <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#526176", letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1 }}>Enrol date</span>
          <span className="cm-date-range">
            <input
              type="date"
              aria-label="Enrol from"
              value={enrollFrom}
              onChange={(e) => { setEnrollFrom(e.target.value); setPage(0); }}
            />
            <span className="cm-date-range-sep">–</span>
            <input
              type="date"
              aria-label="Enrol to"
              value={enrollTo}
              onChange={(e) => { setEnrollTo(e.target.value); setPage(0); }}
            />
          </span>
        </span>

        <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#526176", letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1 }}>Completed date</span>
          <span className="cm-date-range">
            <input
              type="date"
              aria-label="Completed from"
              value={completeFrom}
              onChange={(e) => { setCompleteFrom(e.target.value); setPage(0); }}
            />
            <span className="cm-date-range-sep">–</span>
            <input
              type="date"
              aria-label="Completed to"
              value={completeTo}
              onChange={(e) => { setCompleteTo(e.target.value); setPage(0); }}
            />
          </span>
        </span>

        {hasFilter && (
          <button className="cm-text-button" onClick={reset}>Clear</button>
        )}

        <button
          className="cm-button"
          style={{ marginLeft: "auto" }}
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

      <div className="cm-table-wrap" role="region" aria-label="Skill progress report" tabIndex={0}>
        <table>
          <thead>
            <tr>
              {["Assigned skill", "Current level", "Expected level", "Skill gap", "Enrol date", "Completed date", "Status"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(current * size, (current + 1) * size).map((a) => {
              const gap = skillGap(data, a);
              return (
                <tr key={a.id}>
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
                <td colSpan={7} className="cm-empty">
                  {hasFilter ? "No records match the active filters." : "No skill assignments found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="cm-report-footer">
        <ManagerPageSize value={size} onChange={(v) => { setSize(v); setPage(0); }} />
        <ManagerPagination total={rows.length} page={current} pageSize={size} onPage={setPage} />
      </div>
    </section>
  );
}
