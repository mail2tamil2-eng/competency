import { useState } from "react";
import { Download } from "lucide-react";
import { Data, download, progress } from "./model";
import { WorkflowData } from "./workflowModel";
import { employeeFor, levelName, skillGap } from "./managerModel";
import { ManagerPageSize, ManagerPagination } from "./ManagerPagination";

export const learnerReportHeaders = [
  "User ID",
  "Learner name",
  "Email ID",
  "Role",
  "Department",
  "Reporting manager",
  "Skill",
  "Current level",
  "Expected level",
  "Skill gap",
  "Assigned date",
  "Completed date",
];
export function learnerReportRows(data: Data, work: WorkflowData) {
  return data.assignments.map((a) => {
    const employee = employeeFor(work, a);
    const manager = work.employees.find((e) => e.id === employee?.managerId);
    return {
      id: a.id,
      skillId: a.skillId,
      cells: [
        employee?.id || a.employeeId || "Not recorded",
        a.name,
        employee?.email || "Not recorded",
        employee?.role || "Not recorded",
        employee?.department || a.department,
        manager?.name || "Not recorded",
        data.skills.find((s) => s.id === a.skillId)?.name ||
          "Unavailable skill",
        levelName(data, a.current),
        levelName(data, a.expected),
        skillGap(data, a) ?? "Not assessed",
        a.assignedDate?.slice(0, 10) || "Not recorded",
        a.completedDate?.slice(0, 10) || "Not recorded",
      ],
    };
  });
}
export function Reports({ data, work }: { data: Data; work: WorkflowData }) {
  const [mode, setMode] = useState("skill"),
    [skillId, setSkillId] = useState(""),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(0),
    [size, setSize] = useState(10);
  const term = query.trim().toLowerCase();
  const headers =
    mode === "learner"
      ? learnerReportHeaders
      : ["Skill", "Competency", "Enrolled learners", "Completion %"];
  const rows = (
    mode === "learner"
      ? learnerReportRows(data, work).filter(
          (r) => !skillId || r.skillId === skillId,
        )
      : data.skills.map((s) => {
          const assignments = data.assignments.filter(
            (a) => a.skillId === s.id,
          );
          return {
            id: s.id,
            skillId: s.id,
            cells: [
              s.name,
              data.competencies.find((c) => c.id === s.competencyId)?.name ||
                "Not recorded",
              assignments.length,
              `${assignments.length ? Math.round((assignments.filter((a) => progress(data, a) === "Completed").length / assignments.length) * 100) : 0}%`,
            ],
          };
        })
  ).filter(
    (r) => !term || r.cells.some((v) => String(v).toLowerCase().includes(term)),
  );
  const current = Math.min(
    page,
    Math.max(0, Math.ceil(rows.length / size) - 1),
  );
  return (
    <section className="cm-card">
      <div className="cm-section-head">
        <div>
          <h2>Skill progress reports</h2>
          <p>
            View progress by skill or learner. Exports include every matching
            row.
          </p>
        </div>
        <button
          className="cm-button"
          onClick={() =>
            download(mode + "-report.csv", [
              headers,
              ...rows.map((r) => r.cells.map(String)),
            ])
          }
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>
      <div className="cm-toolbar cm-report-toolbar">
        <label>
          Report type
          <select
            aria-label="Report type"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value);
              setSkillId("");
              setQuery("");
              setPage(0);
            }}
          >
            <option value="skill">Skill-wise learner progress</option>
            <option value="learner">Learner-wise skill report</option>
          </select>
        </label>
        <label>
          Search report
          <input
            aria-label="Search report"
            placeholder="Search name, ID, email or skill"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
        </label>
        {mode === "learner" && (
          <label>
            Skill
            <select
              aria-label="Report skill filter"
              value={skillId}
              onChange={(e) => {
                setSkillId(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All skills</option>
              {data.skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="cm-table-controls">
        <ManagerPageSize
          value={size}
          onChange={(v) => {
            setSize(v);
            setPage(0);
          }}
        />
      </div>
      <div
        className="cm-table-wrap"
        role="region"
        aria-label="Admin report table"
        tabIndex={0}
      >
        <table>
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(current * size, (current + 1) * size).map((r) => (
              <tr key={r.id}>
                {r.cells.map((v, i) => (
                  <td key={i}>
                    {mode === "skill" && i === 2 ? (
                      <button
                        className="cm-link"
                        onClick={() => {
                          setSkillId(r.skillId);
                          setMode("learner");
                          setQuery("");
                          setPage(0);
                        }}
                      >
                        {v} learners
                      </button>
                    ) : (
                      v
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={headers.length}>
                  No matching records. Try another search or filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ManagerPagination
        total={rows.length}
        page={current}
        pageSize={size}
        onPage={setPage}
      />
    </section>
  );
}
