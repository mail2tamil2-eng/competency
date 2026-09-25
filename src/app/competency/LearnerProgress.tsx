import { useState } from "react";
import { Download, Search, Users } from "lucide-react";
import { Data, Assignment, download, progress } from "./model";
import { WorkflowData, updateCurrent } from "./workflowModel";

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
  const [bulk, setBulk] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkLevel, setBulkLevel] = useState("");
  const [dirtyLevels, setDirtyLevels] = useState<Record<string, string>>({});

  const skill = (a: Assignment) => data.skills.find((s) => s.id === a.skillId);
  const competency = (a: Assignment) =>
    data.competencies.find((c) => c.id === skill(a)?.competencyId)?.name || "Uncategorized";
  const levelName = (id: string) =>
    data.levels.find((l) => l.id === id)?.name || "Not recorded";
  const empFor = (a: Assignment) =>
    work.employees.find(
      (e) => e.id === a.employeeId || (e.name === a.name && e.department === a.department),
    );

  const matches = (a: Assignment) => {
    const emp = empFor(a);
    return `${a.name} ${a.department} ${emp?.role ?? ""} ${emp?.email ?? ""} ${skill(a)?.name ?? ""} ${competency(a)}`
      .toLowerCase()
      .includes(query.trim().toLowerCase());
  };

  const records = data.assignments.filter(matches);
  const total = records.length;
  const currentPage = Math.min(page, Math.max(0, Math.ceil(total / 10) - 1));
  const chosen = data.assignments.filter((a) => selected.includes(a.id));

  function setDirty(id: string, val: string, original: string) {
    if (val === original) {
      setDirtyLevels((prev) => { const n = { ...prev }; delete n[id]; return n; });
    } else {
      setDirtyLevels((prev) => ({ ...prev, [id]: val }));
    }
  }

  function saveOne(a: Assignment) {
    const newLevel = dirtyLevels[a.id];
    if (newLevel === undefined) return;
    const next = updateCurrent(data, work, a.id, newLevel, "Admin");
    if (save(next.data, next.work, `Updated ${a.name}: ${skill(a)?.name}`)) {
      setDirtyLevels((prev) => { const n = { ...prev }; delete n[a.id]; return n; });
    }
  }

  function applyBulk() {
    if (!bulkLevel || !chosen.length) return;
    let next = { data, work };
    for (const a of chosen)
      next = updateCurrent(next.data, next.work, a.id, bulkLevel, "Admin");
    if (save(next.data, next.work, `Updated ${chosen.length} skill records`)) {
      setSelected([]);
      setBulkLevel("");
    }
  }

  return (
    <section className="cm-card">
      <div className="cm-section-head">
        <div>
          <h2>Assignments &amp; progress</h2>
          <p>View and update learner proficiency levels across all assigned skills.</p>
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
            placeholder="Search name, role, email, skill…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
          />
        </label>
        <button
          className="cm-button"
          onClick={() => { setBulk(!bulk); setSelected([]); setBulkLevel(""); setPage(0); }}
        >
          <Users size={16} />
          {bulk ? "Exit bulk update" : "Bulk update"}
        </button>
      </div>

      {bulk && (
        <div className="cm-progress-bulk">
          <div>
            <strong>Bulk update mode</strong>
            <p>Select records then pick a level and apply.</p>
            <span>
              {chosen.length} records across {new Set(chosen.map(personKey)).size} learners selected
              {chosen.some((a) => !matches(a)) ? " (includes selections outside this search)" : ""}
            </span>
          </div>
          <div className="cm-actions">
            <select
              aria-label="Bulk current level"
              value={bulkLevel}
              onChange={(e) => setBulkLevel(e.target.value)}
            >
              <option value="">Choose level</option>
              {data.levels.filter((l) => l.status === "Active").map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <button
              className="cm-button primary"
              disabled={!bulkLevel || !chosen.length}
              onClick={applyBulk}
            >
              Apply to {chosen.length || "0"} records
            </button>
            <button
              className="cm-text-button"
              disabled={!chosen.length}
              onClick={() => setSelected([])}
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      <div className="cm-table-wrap">
        <table>
          <thead>
            <tr>
              {bulk && <th>Select</th>}
              <th>Learner</th>
              <th>Role</th>
              <th>Email</th>
              <th>Competency / Skill</th>
              <th>Current level</th>
              <th>Expected level</th>
            </tr>
          </thead>
          <tbody>
            {records.slice(currentPage * 10, (currentPage + 1) * 10).map((a) => {
              const emp = empFor(a);
              const isDirty = dirtyLevels[a.id] !== undefined;
              return (
                <tr key={a.id} className={isDirty ? "cm-row-dirty" : ""}>
                  {bulk && (
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${a.name} ${skill(a)?.name}`}
                        checked={selected.includes(a.id)}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selected, a.id]
                              : selected.filter((id) => id !== a.id),
                          )
                        }
                      />
                    </td>
                  )}
                  <td>
                    <strong>{a.name}</strong>
                    <small>{a.department}</small>
                  </td>
                  <td>{emp?.role || <span className="cm-muted-dash">—</span>}</td>
                  <td>{emp?.email || <span className="cm-muted-dash">—</span>}</td>
                  <td>
                    <small>{competency(a)}</small>
                    <strong>{skill(a)?.name}</strong>
                  </td>
                  <td>
                    <div className="cm-inline-level">
                      <select
                        className="cm-level-inline-select"
                        aria-label={`Current level for ${a.name} ${skill(a)?.name}`}
                        value={dirtyLevels[a.id] ?? a.current}
                        onChange={(e) => setDirty(a.id, e.target.value, a.current)}
                      >
                        <option value="">Not recorded</option>
                        {data.levels
                          .filter((l) => l.status === "Active" || l.id === a.current)
                          .map((l) => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                          ))}
                      </select>
                      {isDirty && (
                        <button className="cm-button primary cm-save-inline" onClick={() => saveOne(a)}>
                          Save
                        </button>
                      )}
                    </div>
                  </td>
                  <td>{levelName(a.expected)}</td>
                </tr>
              );
            })}
            {!total && (
              <tr>
                <td colSpan={bulk ? 7 : 6} className="cm-empty">
                  No records match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="cm-pagination">
        <span>
          {total ? `${currentPage * 10 + 1}–${Math.min((currentPage + 1) * 10, total)} of ${total}` : "0"} skill records
        </span>
        <div>
          <button className="cm-button" disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>
            Previous
          </button>
          <button className="cm-button" disabled={(currentPage + 1) * 10 >= total} onClick={() => setPage(currentPage + 1)}>
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
