import { useState } from "react";
import { Download, Search, Users } from "lucide-react";
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
  const [bulk, setBulk] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [level, setLevel] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [review, setReview] = useState(false);

  const skill = (a: Assignment) => data.skills.find((s) => s.id === a.skillId);
  const competency = (a: Assignment) =>
    data.competencies.find((c) => c.id === skill(a)?.competencyId)?.name ||
    "Uncategorized";
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
  const editRecord = data.assignments.find((a) => a.id === editing);
  const modalRows = editRecord ? [editRecord] : chosen;

  const close = () => {
    if (editing) setEditing(null);
    else setReview(false);
  };

  const changeMode = () => {
    setBulk(!bulk);
    setSelected([]);
    setLevel("");
    setPage(0);
  };

  function commitUpdates() {
    let next = { data, work };
    for (const a of modalRows)
      next = updateCurrent(next.data, next.work, a.id, level, "Admin");
    if (
      save(
        next.data,
        next.work,
        editRecord
          ? `Updated ${editRecord.name}: ${skill(editRecord)?.name}`
          : `Updated ${chosen.length} skill records`,
      )
    ) {
      setEditing(null);
      setReview(false);
      setSelected([]);
      setLevel("");
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
                    a.name,
                    emp?.role ?? "",
                    emp?.email ?? "",
                    a.department,
                    competency(a),
                    skill(a)?.name || "",
                    levelName(a.current),
                    levelName(a.expected),
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
        <button className="cm-button" onClick={changeMode}>
          <Users size={16} />
          {bulk ? "Exit bulk update" : "Bulk update"}
        </button>
      </div>

      {bulk && (
        <div className="cm-progress-bulk">
          <div>
            <strong>Bulk update mode</strong>
            <p>Select skill records to update their current level together.</p>
            <span>
              {chosen.length} skill records across{" "}
              {new Set(chosen.map(personKey)).size} learners selected
              {chosen.some((a) => !matches(a)) ? " (includes selections outside this search)" : ""}
            </span>
          </div>
          <div className="cm-actions">
            <select
              aria-label="Bulk current level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="">Choose current level</option>
              {data.levels.filter((l) => l.status === "Active").map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <button
              className="cm-button primary"
              disabled={!level || !chosen.length}
              onClick={() => setReview(true)}
            >
              Review updates
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
              {!bulk && <th className="cm-right">Action</th>}
            </tr>
          </thead>
          <tbody>
            {records.slice(currentPage * 10, (currentPage + 1) * 10).map((a) => {
              const emp = empFor(a);
              return (
                <tr key={a.id}>
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
                  <td>{emp?.role || <span style={{ color: "#9aa3b3" }}>—</span>}</td>
                  <td>{emp?.email || <span style={{ color: "#9aa3b3" }}>—</span>}</td>
                  <td>
                    <small>{competency(a)}</small>
                    <strong>{skill(a)?.name}</strong>
                  </td>
                  <td>{levelName(a.current)}</td>
                  <td>{levelName(a.expected)}</td>
                  {!bulk && (
                    <td>
                      <button
                        className="cm-button"
                        aria-label={`Update level for ${a.name} ${skill(a)?.name}`}
                        onClick={() => { setEditing(a.id); setLevel(a.current); }}
                      >
                        Update level
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
            {!total && (
              <tr>
                <td colSpan={bulk ? 7 : 8} className="cm-empty">
                  No records match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="cm-pagination">
        <span>
          {total
            ? `${currentPage * 10 + 1}–${Math.min((currentPage + 1) * 10, total)} of ${total}`
            : "0"}{" "}
          skill records
        </span>
        <div>
          <button
            className="cm-button"
            disabled={!currentPage}
            onClick={() => setPage(currentPage - 1)}
          >
            Previous
          </button>
          <button
            className="cm-button"
            disabled={(currentPage + 1) * 10 >= total}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {(review || editing) && (
        <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
          <DialogContent className="cm-dialog cm-wide cm-progress-dialog">
            <DialogHeader>
              <DialogTitle>
                {editRecord ? "Update current level" : "Review bulk update"}
              </DialogTitle>
              <DialogDescription>
                {editRecord
                  ? "Only this learner's selected skill will change when you save."
                  : `Update ${chosen.length} skill records across ${new Set(chosen.map(personKey)).size} learners to ${levelName(level)}.`}
              </DialogDescription>
            </DialogHeader>
            <div className="cm-progress-dialog-body">
              {editRecord ? (
                <>
                  <dl className="cm-progress-context">
                    <div><dt>Learner</dt><dd>{editRecord.name}</dd></div>
                    <div><dt>Competency</dt><dd>{competency(editRecord)}</dd></div>
                    <div><dt>Skill</dt><dd>{skill(editRecord)?.name}</dd></div>
                    <div>
                      <dt>Current → expected</dt>
                      <dd>{levelName(editRecord.current)} → {levelName(editRecord.expected)}</dd>
                    </div>
                  </dl>
                  <label>
                    New current level
                    <select
                      aria-label="New current level"
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                    >
                      <option value="">Not recorded</option>
                      {data.levels
                        .filter((l) => l.status === "Active" || l.id === editRecord.current)
                        .map((l) => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                    </select>
                  </label>
                </>
              ) : (
                <div className="cm-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Learner</th>
                        <th>Competency / skill</th>
                        <th>Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chosen.map((a) => (
                        <tr key={a.id}>
                          <td>{a.name}<small>{a.department}</small></td>
                          <td><small>{competency(a)}</small><strong>{skill(a)?.name}</strong></td>
                          <td>{levelName(a.current)} → {levelName(level)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="cm-dialog-actions">
              <button className="cm-button" onClick={close}>
                {editing ? "Cancel" : "Back to selection"}
              </button>
              <button
                className="cm-button primary"
                disabled={editRecord ? level === editRecord.current : !level || !chosen.length}
                onClick={commitUpdates}
              >
                {editing ? "Save level" : "Confirm updates"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
