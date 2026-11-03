import { useState } from "react";
import { Layers, ChevronDown, Search } from "lucide-react";
import { Data, RecordItem } from "./model";
import { Plan } from "./workflowModel";

type Props = {
  data: Data;
  selected: Plan["skills"];
  onChange: (skills: Plan["skills"]) => void;
  readOnly?: boolean;
};
const PAGE_SIZE = 8;

export function AssignmentSkills({
  data,
  selected,
  onChange,
  readOnly = false,
}: Props) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [onlySelected, setOnlySelected] = useState(false);
  const term = query.trim().toLowerCase();
  const groups = data.competencies.filter(
    (c) =>
      (!categoryId || c.categoryId === categoryId) &&
      (c.status === "Active" ||
      selected.some(
        (x) =>
          data.skills.find((s) => s.id === x.skillId)?.competencyId === c.id,
      )),
  );
  const missing = selected.filter((s) => !s.expected).length;
  return (
    <section
      className="cm-assignment-picker"
      aria-label="Competency and Skill Selection"
    >
      <p className="cm-assignment-help">
        {readOnly
          ? "Check the expected level for each skill under its competency."
          : "Open a competency, select its skills, then choose the expected level for each skill."}
      </p>
      <div className="cm-assignment-search">
        <label className="cm-assignment-category-filter">
          <span>Category</span>
          <select
            aria-label="Filter Assignment Competencies by Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">All Categories</option>
            {data.categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <div className="cm-search">
          <Search size={16} />
          <input
            aria-label="Search Assignment Competencies and Skills"
            placeholder="Search competencies or skills…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {!readOnly && (
          <label className="cm-assignment-filter">
            <input
              type="checkbox"
              checked={onlySelected}
              onChange={(e) => setOnlySelected(e.target.checked)}
            />
            Selected Only
          </label>
        )}
      </div>
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
              s.competencyId === c.id &&
              (s.status === "Active" ||
                selected.some((x) => x.skillId === s.id)),
          );
          const visible = all.filter(
            (s) =>
              (!(onlySelected || readOnly) ||
                selected.some((x) => x.skillId === s.id)) &&
              (!term ||
                c.name.toLowerCase().includes(term) ||
                s.name.toLowerCase().includes(term)),
          );
          if (!visible.length && (term || onlySelected || readOnly))
            return null;
          return (
            <SkillGroup
              key={c.id}
              competency={c}
              skills={visible}
              total={all.length}
              levels={data.levels.filter((l) => l.status === "Active")}
              selected={selected}
              onChange={onChange}
              filterKey={`${categoryId}:${term}:${onlySelected}`}
              searching={!!term || onlySelected || readOnly}
              readOnly={readOnly}
            />
          );
        })}
        <p className="cm-assignment-no-results">
          No matching competencies or skills. Try another category or search, or turn off
          Selected Only.
        </p>
      </div>
    </section>
  );
}

function SkillGroup({
  competency,
  skills,
  total,
  levels,
  selected,
  onChange,
  filterKey,
  searching,
  readOnly,
}: {
  competency: RecordItem;
  skills: RecordItem[];
  total: number;
  levels: RecordItem[];
  selected: Plan["skills"];
  onChange: Props["onChange"];
  filterKey: string;
  searching: boolean;
  readOnly: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [paging, setPaging] = useState({ key: filterKey, page: 0 });
  const page = Math.min(
    paging.key === filterKey ? paging.page : 0,
    Math.max(0, Math.ceil(skills.length / PAGE_SIZE) - 1),
  );
  const rows = skills.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const ids = new Set(skills.map((s) => s.id));
  const chosen = selected.filter((s) => ids.has(s.skillId));
  const expanded = searching || open;
  const setLevel = (id: string, expected: string) =>
    onChange(selected.map((s) => (s.skillId === id ? { ...s, expected } : s)));
  return (
    <section
      className="cm-assignment-group"
      aria-label={`${competency.name} competency`}
    >
      <button
        type="button"
        className="cm-assignment-group-toggle"
        aria-label={competency.name}
        aria-expanded={expanded}
        aria-controls={`assignment-${competency.id}`}
        onClick={() => setOpen(!open)}
        disabled={searching}
      >
        <span className="cm-mini-icon">
          <Layers size={20} />
        </span>
        <span>
          <small>Competency</small>
          <strong>{competency.name}</strong>
          <span>
            {total} Skills · {chosen.length} Selected
          </span>
        </span>
        <ChevronDown size={18} className={expanded ? "cm-rotated" : ""} />
      </button>
      {expanded && (
        <div
          id={`assignment-${competency.id}`}
          className="cm-assignment-group-body"
        >
          {!readOnly && !!skills.length && (
            <div className="cm-assignment-bulk">
              <button
                type="button"
                className="cm-text-button"
                onClick={() =>
                  onChange([
                    ...selected,
                    ...rows
                      .filter((s) => !selected.some((x) => x.skillId === s.id))
                      .map((s) => ({ skillId: s.id, expected: "" })),
                  ])
                }
              >
                Select This Page ({rows.length})
              </button>
              <button
                type="button"
                className="cm-text-button"
                disabled={!chosen.length}
                onClick={() =>
                  onChange(selected.filter((s) => !ids.has(s.skillId)))
                }
              >
                Clear {filterKey.startsWith(":") ? "Group" : "Matching Skills"}
              </button>
              <select
                aria-label={`Set level for selected skills in ${competency.name}`}
                disabled={!chosen.length}
                value=""
                onChange={(e) =>
                  onChange(
                    selected.map((s) =>
                      ids.has(s.skillId)
                        ? { ...s, expected: e.target.value }
                        : s,
                    ),
                  )
                }
              >
                <option value="">
                  Set Level For {chosen.length} Selected…
                </option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          )}
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
            const selection = selected.find((x) => x.skillId === s.id);
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
                      onChange={(e) =>
                        onChange(
                          e.target.checked
                            ? [...selected, { skillId: s.id, expected: "" }]
                            : selected.filter((x) => x.skillId !== s.id),
                        )
                      }
                    />
                    <strong>{s.name}</strong>
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
                      onChange={(e) => setLevel(s.id, e.target.value)}
                    >
                      <option value="">
                        {selection ? "Choose Level" : "Select Skill First"}
                      </option>
                      {levels.map((l) => (
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
