import { useState } from "react";
import { Data, progress } from "./model";
import { levelName, personKey, skillGap } from "./managerModel";
import { ManagerPageSize, ManagerPagination } from "./ManagerPagination";

export function LearnerSkillReport({
  data,
  learnerKey,
  onLearnerChange,
}: {
  data: Data;
  learnerKey: string;
  onLearnerChange: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const people = [
    ...new Map(data.assignments.map((a) => [personKey(a), a])).entries(),
  ];
  const selected = people.some(([id]) => id === learnerKey)
    ? learnerKey
    : people[0]?.[0] || "";
  const skill = (id: string) =>
    data.skills.find((s) => s.id === id)?.name || "Unavailable skill";
  const rows = data.assignments.filter(
    (a) =>
      personKey(a) === selected &&
      (!status || progress(data, a) === status) &&
      skill(a.skillId).toLowerCase().includes(query.trim().toLowerCase()),
  );
  const current = Math.min(
    page,
    Math.max(0, Math.ceil(rows.length / size) - 1),
  );
  return (
    <section className="cm-card">
      <div className="cm-section-head">
        <div>
          <h2>My skill progress report</h2>
          <p>
            Track your assigned skills and progress towards the expected levels.
          </p>
        </div>
        <label>
          Preview learner
          <select
            aria-label="Preview learner"
            value={selected}
            onChange={(e) => {
              onLearnerChange(e.target.value);
              setPage(0);
            }}
          >
            <option value="" disabled>
              Select learner
            </option>
            {people.map(([id, a]) => (
              <option key={id} value={id}>
                {a.name} · {a.department}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="cm-toolbar cm-report-toolbar">
        <label>
          Search assigned skill
          <input
            aria-label="Search assigned skill"
            value={query}
            placeholder="Search skill name"
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
        </label>
        <label>
          Status
          <select
            aria-label="Filter skill status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All statuses</option>
            {["Completed", "In Progress", "Yet to Start"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
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
        aria-label="Learner skill progress report"
        tabIndex={0}
      >
        <table>
          <thead>
            <tr>
              {[
                "Assigned skill",
                "Current level",
                "Expected level",
                "Skill gap",
                "Assigned date",
                "Completed date",
                "Status",
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(current * size, (current + 1) * size).map((a) => (
              <tr key={a.id}>
                <td>
                  <strong>{skill(a.skillId)}</strong>
                </td>
                <td>{levelName(data, a.current)}</td>
                <td>{levelName(data, a.expected)}</td>
                <td>
                  {skillGap(data, a) ?? (
                    <span title="A current level is needed to calculate the gap">
                      Not assessed
                    </span>
                  )}
                </td>
                <td>{a.assignedDate?.slice(0, 10) || "Not recorded"}</td>
                <td>{a.completedDate?.slice(0, 10) || "Not recorded"}</td>
                <td>
                  <span
                    className={`cm-manager-status ${progress(data, a) === "Completed" ? "success" : progress(data, a) === "In Progress" ? "pending" : ""}`}
                  >
                    {progress(data, a)}
                  </span>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={7}>
                  {data.assignments.some((a) => personKey(a) === selected)
                    ? "No skills match your search or status filter."
                    : "No skills have been assigned yet."}
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
