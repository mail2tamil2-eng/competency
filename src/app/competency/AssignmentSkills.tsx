import { useState } from "react";
import { Layers, X } from "lucide-react";
import { DisclosureIcon } from "./Disclosure";
import { MultiCheckDropdown } from "./MultiCheckDropdown";
import { Data, RecordItem, compIdsOf, inComp, skillLevels } from "./model";
import { Plan, Course } from "./workflowModel";

type Props = {
  data: Data;
  /** Used to warn when a selected skill has no mapped courses. */
  courses?: Course[];
  selected: Plan["skills"];
  onChange: (skills: Plan["skills"]) => void;
  readOnly?: boolean;
};
const PAGE_SIZE = 8;
type Selection = Plan["skills"][number];

/** The competency a selection belongs to; older plans fall back to the skill's first competency. */
function ownerOf(data: Data, x: Selection): string {
  return x.competencyId || compIdsOf(data.skills.find((s) => s.id === x.skillId))[0] || "";
}

export function AssignmentSkills({
  data,
  courses = [],
  selected,
  onChange,
  readOnly = false,
}: Props) {
  const selectedCompIds = [...new Set(selected.map((x) => ownerOf(data, x)))];
  /* Competencies the admin has chosen from the dropdown; ones already used by the assignment always show. */
  const [added, setAdded] = useState<string[]>(selectedCompIds);
  const shownIds = [...added, ...selectedCompIds.filter((id) => !added.includes(id))];
  const groups = shownIds
    .map((id) => data.competencies.find((c) => c.id === id))
    .filter((c): c is RecordItem => !!c);
  const skillsOf = (cId: string) => data.skills.filter((s) => inComp(s, cId) && s.status === "Active");
  /** Adding a competency selects all its skills that aren't already picked under another competency. */
  function addCompetency(id: string) {
    setAdded((a) => [...a, id]);
    const fresh = skillsOf(id)
      .filter((sk) => !selected.some((x) => x.skillId === sk.id))
      .map((sk) => ({ skillId: sk.id, expected: "", competencyId: id }));
    if (fresh.length) onChange([...selected, ...fresh]);
  }
  function removeCompetency(id: string) {
    setAdded((a) => a.filter((x) => x !== id));
    onChange(selected.filter((x) => ownerOf(data, x) !== id));
  }
  const missing = selected.filter((s) => !s.expected).length;
  return (
    <section
      className="cm-assignment-picker"
      aria-label="Competency and Skill Selection"
    >
      <p className="cm-assignment-help">
        {readOnly
          ? "Check the expected level for each skill under its competency."
          : "Choose competencies — all their skills are selected. Untick any you don't need, then set the expected level."}
      </p>
      {!readOnly && (
        <div className="cm-assignment-comp-field">
            <MultiCheckDropdown
              ariaLabel="Select competencies"
              placeholder="Select competencies…"
              noun="competency"
              nounPlural="competencies"
              items={data.competencies
                .filter((c) => c.status === "Active" || shownIds.includes(c.id))
                .map((c) => {
                  const n = skillsOf(c.id).length;
                  return { id: c.id, label: c.name, description: `${n} skill${n === 1 ? "" : "s"}` };
                })}
              selectedIds={shownIds}
              onToggle={(id) => (shownIds.includes(id) ? removeCompetency(id) : addCompetency(id))}
            />
        </div>
      )}
      <div className="cm-assignment-count" role="status">
        <strong>{selected.length} Skills Selected</strong>
        <span>
          {missing
            ? `${missing} need an expected level`
            : "All Selected Levels Set"}
        </span>
      </div>
      <div className="cm-assignment-groups">
        {groups.map((c) => {
          const all = data.skills.filter(
            (s) =>
              inComp(s, c.id) &&
              (s.status === "Active" ||
                selected.some((x) => x.skillId === s.id)),
          );
          const visible = all.filter(
            (s) => !readOnly || selected.some((x) => x.skillId === s.id && ownerOf(data, x) === c.id),
          );
          if (!visible.length && readOnly) return null;
          return (
            <SkillGroup
              key={c.id}
              competency={c}
              data={data}
              courses={courses}
              skills={visible}
              all={all}
              total={all.length}
              levels={data.levels.filter((l) => l.status === "Active")}
              selected={selected}
              onChange={onChange}
              filterKey={c.id}
              searching={readOnly}
              readOnly={readOnly}
              onRemove={readOnly ? undefined : () => removeCompetency(c.id)}
            />
          );
        })}
        {!groups.length && !readOnly && (
          <div className="cm-assignment-empty">
            <Layers size={22} />
            <p>
              <strong>No competency chosen yet</strong>
              <span>Choose one or more competencies above to see their skills.</span>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function SkillGroup({
  competency,
  data,
  courses,
  skills,
  all,
  total,
  levels,
  selected,
  onChange,
  filterKey,
  searching,
  readOnly,
  onRemove,
}: {
  competency: RecordItem;
  data: Data;
  courses: Course[];
  skills: RecordItem[];
  all: RecordItem[];
  total: number;
  levels: RecordItem[];
  selected: Plan["skills"];
  onChange: Props["onChange"];
  filterKey: string;
  searching: boolean;
  readOnly: boolean;
  onRemove?: () => void;
}) {
  const cId = competency.id;
  /* A skill counts as selected here only when it was picked under this competency. */
  const mine = (x: Selection) => ownerOf(data, x) === cId;
  const elsewhere = (skillId: string) => selected.find((x) => x.skillId === skillId && !mine(x));
  // Chosen competencies open straight away so their skills are visible.
  const [open, setOpen] = useState(true);
  const [paging, setPaging] = useState({ key: filterKey, page: 0 });
  const page = Math.min(
    paging.key === filterKey ? paging.page : 0,
    Math.max(0, Math.ceil(skills.length / PAGE_SIZE) - 1),
  );
  const rows = skills.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const ids = new Set(skills.map((s) => s.id));
  const allIds = new Set(all.map((s) => s.id));
  const chosen = selected.filter((s) => ids.has(s.skillId) && mine(s));
  const allChosen = selected.filter((s) => allIds.has(s.skillId) && mine(s));
  const available = all.filter((s) => !elsewhere(s.id));
  const allChecked = allChosen.length > 0 && allChosen.length === available.length;
  const allIndeterminate = allChosen.length > 0 && allChosen.length < available.length;
  const commonLevel =
    allChosen.length > 0 && allChosen.every((s) => s.expected && s.expected === allChosen[0].expected)
      ? allChosen[0].expected
      : "";
  const expanded = searching || open;
  const setLevel = (id: string, expected: string) =>
    onChange(selected.map((s) => (s.skillId === id && mine(s) ? { ...s, expected } : s)));
  return (
    <section
      className="cm-assignment-group"
      aria-label={`${competency.name} competency`}
    >
      <div className="cm-assignment-group-header">

        <div
          className="cm-assignment-group-toggle"
          role="button"
          tabIndex={searching ? -1 : 0}
          aria-label={competency.name}
          aria-expanded={expanded}
          aria-controls={`assignment-${competency.id}`}
          onClick={() => !searching && setOpen(!open)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!searching) setOpen(!open);
            }
          }}
        >
          {!searching && <DisclosureIcon open={expanded} />}
          <span className="cm-mini-icon">
            <Layers size={20} />
          </span>
          <span>
            <small>Competency</small>
            <strong>{competency.name}</strong>
            <span>
              {total} Skill{total === 1 ? "" : "s"} · {chosen.length} Selected
            </span>
          </span>
          {!readOnly && (
            <select
              className="cm-group-level-select"
              aria-label={`Set level for selected skills in ${competency.name}`}
              disabled={!allChosen.length}
              value={commonLevel}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              onChange={(e) => {
                if (!e.target.value) return;
                onChange(
                  selected.map((s) =>
                    allIds.has(s.skillId) && mine(s) &&
                    skillLevels(data, data.skills.find((x) => x.id === s.skillId)).some((l) => l.id === e.target.value)
                      ? { ...s, expected: e.target.value }
                      : s,
                  ),
                );
              }}
            >
              <option value="">Set Expected Level</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          )}
        </div>
        {onRemove && (
          <button
            type="button"
            className="cm-icon-button cm-remove-competency"
            aria-label={`Remove ${competency.name}`}
            title="Remove this competency and its selected skills"
            onClick={onRemove}
          >
            <X size={16} />
          </button>
        )}
      </div>
      {expanded && (
        <div
          id={`assignment-${competency.id}`}
          className="cm-assignment-group-body"
        >
          <div className="cm-assignment-columns">
            <span>SKILL</span>
            <span>EXPECTED LEVEL</span>
          </div>
          {!skills.length && (
            <p className="cm-assignment-help">
              No active skills in this competency. Add skills in Competency
              framework first.
            </p>
          )}
          {rows.map((s) => {
            const selection = selected.find((x) => x.skillId === s.id && mine(x));
            const other = elsewhere(s.id);
            const otherName = other ? data.competencies.find((c) => c.id === ownerOf(data, other))?.name : "";
            return (
              <div
                className={`cm-assignment-skill ${selection ? "is-selected" : ""}`}
                key={s.id}
              >
                {readOnly ? (
                  <strong>{s.name}</strong>
                ) : (
                  <label className="cm-assignment-skill-label">
                    <input
                      type="checkbox"
                      aria-label={s.name}
                      checked={!!selection}
                      disabled={!!other}
                      onChange={(e) =>
                        onChange(
                          e.target.checked
                            ? [...selected, { skillId: s.id, expected: "", competencyId: cId }]
                            : selected.filter((x) => !(x.skillId === s.id && mine(x))),
                        )
                      }
                    />
                    <strong>{s.name}</strong>
                    {other && <small className="cm-selected-elsewhere">Selected under {otherName}</small>}
                  </label>
                )}
                {readOnly ? (
                  <span className="cm-category">
                    {levels.find((l) => l.id === selection?.expected)?.name ||
                      "Level unavailable"}
                  </span>
                ) : (
                  <div>
                    <select
                      aria-label={`Expected level for ${s.name}`}
                      disabled={!selection}
                      value={selection?.expected || ""}
                      title={other ? `Set the level under ${otherName}` : undefined}
                      onChange={(e) => setLevel(s.id, e.target.value)}
                    >
                      <option value="">
                        {selection ? "Choose Level" : other ? "Selected Elsewhere" : "Select Skill First"}
                      </option>
                      {skillLevels(data, s).map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                    {selection && !selection.expected && (
                      <small className="cm-assignment-required">
                        Expected level required
                      </small>
                    )}
                    {selection && !courses.some((co) => co.mappings.some((m) => m.skillId === s.id)) && (
                      <small className="cm-assignment-required" role="alert">
                        No courses are mapped to the selected skill.
                      </small>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {skills.length > PAGE_SIZE && (
            <div className="cm-pagination">
              <span>
                {page * PAGE_SIZE + 1}–
                {Math.min((page + 1) * PAGE_SIZE, skills.length)} Of{" "}
                {skills.length} Skills
              </span>
              <div>
                <button
                  type="button"
                  className="cm-button"
                  aria-label={`Previous skills in ${competency.name}`}
                  disabled={!page}
                  onClick={() => setPaging({ key: filterKey, page: page - 1 })}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="cm-button"
                  aria-label={`Next skills in ${competency.name}`}
                  disabled={(page + 1) * PAGE_SIZE >= skills.length}
                  onClick={() => setPaging({ key: filterKey, page: page + 1 })}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
