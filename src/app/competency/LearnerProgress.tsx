import { useState } from "react";
import { Download, Plus, Search, Users, ArrowRight } from "lucide-react";
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
  onAssign,
}: {
  data: Data;
  work: WorkflowData;
  save: (data: Data, work: WorkflowData, message: string) => boolean;
  onAssign: () => void;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [bulk, setBulk] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [level, setLevel] = useState("");
  const [person, setPerson] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [review, setReview] = useState(false);
  const skill = (a: Assignment) => data.skills.find((s) => s.id === a.skillId);
  const competency = (a: Assignment) =>
    data.competencies.find((c) => c.id === skill(a)?.competencyId)?.name ||
    "Uncategorized competency";
  const levelName = (id: string) =>
    data.levels.find((l) => l.id === id)?.name || "Not recorded";
  const groups = new Map<string, Assignment[]>();
  for (const a of data.assignments)
    groups.set(personKey(a), [...(groups.get(personKey(a)) || []), a]);
  const matches = (a: Assignment) =>
    `${a.name} ${a.department} ${skill(a)?.name} ${competency(a)}`
      .toLowerCase()
      .includes(query.trim().toLowerCase());
  const people = [...groups.entries()].filter(([, rows]) => rows.some(matches));
  const records = data.assignments.filter(matches);
  const total = bulk ? records.length : people.length;
  const currentPage = Math.min(page, Math.max(0, Math.ceil(total / 10) - 1));
  const chosen = data.assignments.filter((a) => selected.includes(a.id));
  const personRows = person ? groups.get(person) || [] : [];
  const editRecord = data.assignments.find((a) => a.id === editing);
  const modalRows = editRecord ? [editRecord] : review ? chosen : personRows;
  const close = () => {
    if (editing) setEditing(null);
    else if (review) setReview(false);
    else setPerson(null);
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
          <h2>Assignments & progress</h2>
          <p>
            View a learner’s skills and update their proficiency individually.
          </p>
        </div>
        <div className="cm-actions">
          <button
            className="cm-button"
            onClick={() =>
              download("learner-progress.csv", [
                [
                  "Learner",
                  "Department",
                  "Competency",
                  "Skill",
                  "Current level",
                  "Expected level",
                  "Status",
                ],
                ...data.assignments.map((a) => [
                  a.name,
                  a.department,
                  competency(a),
                  skill(a)?.name || "",
                  levelName(a.current),
                  levelName(a.expected),
                  progress(data, a),
                ]),
              ])
            }
          >
            <Download size={16} />
            Export CSV
          </button>
          <button className="cm-button primary" onClick={onAssign}>
            <Plus size={16} />
            Assign skill
          </button>
        </div>
      </div>
      <div className="cm-toolbar">
        <label className="cm-search">
          <Search size={16} />
          <input
            aria-label="Search learners"
            placeholder="Search learner, department, competency or skill…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
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
            <p>
              Select specific skill records. Each checkbox affects one learner
              and one skill.
            </p>
            <span>
              {chosen.length} skill records across{" "}
              {new Set(chosen.map(personKey)).size} learners selected
              {chosen.some((a) => !matches(a))
                ? " (includes selections outside this search)"
                : ""}
            </span>
          </div>
          <div className="cm-actions">
            <select
              aria-label="Bulk current level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="">Choose current level</option>
              {data.levels
                .filter((l) => l.status === "Active")
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
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
              {bulk ? (
                <>
                  <th>Select</th>
                  <th>Learner</th>
                  <th>Competency / skill</th>
                  <th>Current level</th>
                  <th>Expected level</th>
                </>
              ) : (
                <>
                  <th>Learner</th>
                  <th>Department</th>
                  <th>Assigned skills</th>
                  <th>Progress</th>
                  <th>Action</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {bulk
              ? records
                  .slice(currentPage * 10, (currentPage + 1) * 10)
                  .map((a) => (
                    <tr key={a.id}>
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
                      <td>
                        <strong>{a.name}</strong>
                        <small>{a.department}</small>
                      </td>
                      <td>
                        <small>{competency(a)}</small>
                        <strong>{skill(a)?.name}</strong>
                      </td>
                      <td>{levelName(a.current)}</td>
                      <td>{levelName(a.expected)}</td>
                    </tr>
                  ))
              : people
                  .slice(currentPage * 10, (currentPage + 1) * 10)
                  .map(([id, rows]) => {
                    const completed = rows.filter(
                      (a) => progress(data, a) === "Completed",
                    ).length;
                    return (
                      <tr key={id}>
                        <td>
                          <strong>{rows[0].name}</strong>
                        </td>
                        <td>{rows[0].department}</td>
                        <td>
                          {rows.length} skills
                          <small>
                            {new Set(rows.map(competency)).size} competencies
                          </small>
                        </td>
                        <td>
                          <span>
                            {completed} of {rows.length} skills completed
                          </span>
                          <progress
                            className="cm-learner-meter"
                            value={completed}
                            max={rows.length}
                            aria-label={`${rows[0].name} completed skills`}
                          />
                        </td>
                        <td>
                          <button
                            className="cm-button"
                            aria-label={`View skills for ${rows[0].name}`}
                            onClick={() => setPerson(id)}
                          >
                            View skills <ArrowRight size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
            {!total && (
              <tr>
                <td colSpan={5} className="cm-empty">
                  No learners match your search.
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
          {bulk ? "skill records" : "learners"}
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
      {(person || review || editing) && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) close();
          }}
        >
          <DialogContent className="cm-dialog cm-wide cm-progress-dialog">
            <DialogHeader>
              <DialogTitle>
                {editRecord
                  ? "Update current level"
                  : review
                    ? "Review bulk update"
                    : `${personRows[0]?.name} · Skills & progress`}
              </DialogTitle>
              <DialogDescription>
                {editRecord
                  ? "Only this learner’s selected skill will change when you save."
                  : review
                    ? `Update ${chosen.length} skill records across ${new Set(chosen.map(personKey)).size} learners to ${levelName(level)}.`
                    : `${personRows[0]?.department} · ${personRows.length} assigned skills. Open a competency to view its skills.`}
              </DialogDescription>
            </DialogHeader>
            <div className="cm-progress-dialog-body">
              {editRecord ? (
                <>
                  <dl className="cm-progress-context">
                    <div>
                      <dt>Learner</dt>
                      <dd>{editRecord.name}</dd>
                    </div>
                    <div>
                      <dt>Competency</dt>
                      <dd>{competency(editRecord)}</dd>
                    </div>
                    <div>
                      <dt>Skill</dt>
                      <dd>{skill(editRecord)?.name}</dd>
                    </div>
                    <div>
                      <dt>Current → expected</dt>
                      <dd>
                        {levelName(editRecord.current)} →{" "}
                        {levelName(editRecord.expected)}
                      </dd>
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
                        .filter(
                          (l) =>
                            l.status === "Active" ||
                            l.id === editRecord.current,
                        )
                        .map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                          </option>
                        ))}
                    </select>
                  </label>
                </>
              ) : review ? (
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
                          <td>
                            {a.name}
                            <small>{a.department}</small>
                          </td>
                          <td>
                            <small>{competency(a)}</small>
                            <strong>{skill(a)?.name}</strong>
                          </td>
                          <td>
                            {levelName(a.current)} → {levelName(level)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                [...new Set(personRows.map(competency))].map((name) => (
                  <details className="cm-person-competency" key={name} open>
                    <summary>
                      <small>COMPETENCY</small>
                      <strong>{name}</strong>
                      <span>
                        {
                          personRows.filter((a) => competency(a) === name)
                            .length
                        }{" "}
                        skills
                      </span>
                    </summary>
                    {personRows
                      .filter((a) => competency(a) === name)
                      .map((a) => (
                        <div className="cm-person-skill" key={a.id}>
                          <div>
                            <small>SKILL</small>
                            <strong>{skill(a)?.name}</strong>
                            <p>
                              Current: {levelName(a.current)}{" "}
                              <ArrowRight size={14} /> Expected:{" "}
                              {levelName(a.expected)}
                            </p>
                            <span
                              className={`cm-badge ${progress(data, a) === "Completed" ? "active" : "draft"}`}
                            >
                              {progress(data, a)}
                            </span>
                            {a.updatedBy && (
                              <small>Updated by {a.updatedBy}</small>
                            )}
                          </div>
                          <button
                            className="cm-button"
                            aria-label={`Update level for ${a.name} ${skill(a)?.name}`}
                            onClick={() => {
                              setEditing(a.id);
                              setLevel(a.current);
                            }}
                          >
                            Update level
                          </button>
                        </div>
                      ))}
                  </details>
                ))
              )}
            </div>
            <div className="cm-dialog-actions">
              <button className="cm-button" onClick={close}>
                {editing
                  ? "Cancel"
                  : review
                    ? "Back to selection"
                    : "Close learner"}
              </button>
              {(editing || review) && (
                <button
                  className="cm-button primary"
                  disabled={
                    editRecord
                      ? level === editRecord.current
                      : !level || !chosen.length
                  }
                  onClick={commitUpdates}
                >
                  {editing ? "Save level" : "Confirm updates"}
                </button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
