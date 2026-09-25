import { useState, useEffect, useRef } from "react";
import { Search, Plus, ChevronDown, X } from "lucide-react";
import { Data } from "./model";
import { Plan, WorkflowData } from "./workflowModel";
import { AssignmentSkills } from "./AssignmentSkills";
import { ManualAudience } from "./ManualAudience";

const today = new Date().toLocaleDateString("en-CA");

function ChipSelectField({
  label,
  field,
  options,
  selected,
  onChange,
}: {
  label: string;
  field: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase()),
  );

  function toggle(v: string, checked: boolean) {
    onChange(checked ? [...selected, v] : selected.filter((x) => x !== v));
  }

  return (
    <div className="cm-chip-field">
      <span className="cm-multi-check-label">{label}</span>
      <div className="cm-chip-area" ref={ref}>
        <div className="cm-chips" onClick={() => !open && setOpen(true)}>
          {selected.map((v) => (
            <span key={v} className="cm-chip">
              {v}
              <button
                type="button"
                className="cm-chip-remove"
                aria-label={`Remove ${v}`}
                onClick={(e) => { e.stopPropagation(); toggle(v, false); }}
              >
                <X size={11} />
              </button>
            </span>
          ))}
          <button
            type="button"
            className="cm-chip-add"
            onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
          >
            <Plus size={13} />
            {selected.length === 0 ? `Select ${field}` : "Add"}
            <ChevronDown size={12} className={open ? "cm-rotated" : ""} />
          </button>
        </div>

        {open && (
          <div className="cm-chip-dropdown">
            <label className="cm-panel-search">
              <Search size={14} />
              <input
                autoFocus
                placeholder={`Search ${field}s…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} style={{ color: "#526176" }}>
                  <X size={13} />
                </button>
              )}
            </label>
            <div className="cm-panel-list">
              {options.length === 0 ? (
                <p className="cm-panel-no-results">No {field} data available</p>
              ) : filtered.length === 0 ? (
                <p className="cm-panel-no-results">No {field}s match &ldquo;{search}&rdquo;</p>
              ) : (
                filtered.map((v) => {
                  const isSelected = selected.includes(v);
                  return (
                    <label key={v} className={"cm-panel-item" + (isSelected ? " checked" : "")}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggle(v, e.target.checked)}
                      />
                      {v}
                    </label>
                  );
                })
              )}
            </div>
            <div className="cm-chip-dropdown-footer">
              <button
                type="button"
                className="cm-text-button"
                style={{ fontSize: 13 }}
                onClick={() => { onChange([]); }}
              >
                Clear all
              </button>
              <button
                type="button"
                className="cm-button primary"
                style={{ padding: "6px 14px", fontSize: 13, minHeight: 30 }}
                onClick={() => { setOpen(false); setSearch(""); }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AssignmentConfiguration({
  data,
  work,
  draft,
  onChange,
}: {
  data: Data;
  work: WorkflowData;
  draft: Plan;
  onChange: (plan: Plan) => void;
}) {
  const allDepts = [...new Set(work.employees.map((e) => e.department).filter(Boolean))].sort();
  const allRoles = [...new Set(work.employees.map((e) => e.role).filter(Boolean))].sort();
  const allCohorts = [...new Set(work.employees.map((e) => e.cohort).filter((v): v is string => Boolean(v)))].sort();

  return (
    <div className="cm-assignment-config">
      <section className="cm-config-section">
        <h3>1. Assignment details</h3>
        <label>
          Assignment name *
          <input
            aria-label="Assignment name"
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
            placeholder="e.g. Sales communication skills"
          />
        </label>
      </section>

      <section className="cm-config-section">
        <h3>2. Competencies &amp; skills</h3>
        <AssignmentSkills
          data={data}
          selected={draft.skills}
          onChange={(skills) => onChange({ ...draft, skills })}
        />
      </section>

      <section className="cm-config-section">
        <h3>3. Enrolment &amp; audience</h3>
        <div className="cm-config-grid">
          <label>
            Enrolment method
            <select
              aria-label="Enrolment method"
              aria-describedby="enrolment-method-help"
              value={draft.method}
              onChange={(e) =>
                onChange({
                  ...draft,
                  method: e.target.value as Plan["method"],
                  type: e.target.value === "Manual" ? "Static" : draft.type,
                  location: "",
                })
              }
            >
              <option>Auto</option>
              <option>Manual</option>
            </select>
            <small id="enrolment-method-help">
              {draft.method === "Auto"
                ? "The system automatically enrols users based on the defined profile."
                : "The admin manually selects and enrols users."}
            </small>
          </label>
          <label>
            Enrolment type
            <select
              aria-label="Enrolment type"
              aria-describedby="enrolment-type-help"
              disabled={draft.method === "Manual"}
              value={draft.type}
              onChange={(e) =>
                onChange({ ...draft, type: e.target.value as Plan["type"] })
              }
            >
              <option>Static</option>
              <option>Dynamic</option>
            </select>
            <small id="enrolment-type-help">
              {draft.type === "Static"
                ? "Skills are assigned to existing users only."
                : "Skills are assigned to existing and new users who match the defined profile."}
              {draft.method === "Manual" &&
                " Manual enrolment uses a fixed selection, so Dynamic is unavailable."}
            </small>
          </label>
        </div>

        {draft.method === "Manual" ? (
          <ManualAudience
            employees={work.employees}
            selected={draft.employeeIds}
            onChange={(employeeIds) => onChange({ ...draft, employeeIds })}
          />
        ) : (
          <div className="cm-auto-audience">
            <h4>Define user profile</h4>
            <p>
              Users matching <strong>any</strong> selection in each field will be enrolled.
              Leave a field empty to include all.
            </p>
            <div className="cm-audience-fields">
              <ChipSelectField
                label="Department"
                field="department"
                options={allDepts}
                selected={draft.departments ?? []}
                onChange={(departments) => onChange({ ...draft, departments, department: "" })}
              />
              <ChipSelectField
                label="Role"
                field="role"
                options={allRoles}
                selected={draft.roles ?? []}
                onChange={(roles) => onChange({ ...draft, roles, role: "" })}
              />
              <ChipSelectField
                label="Cohort"
                field="cohort"
                options={allCohorts}
                selected={draft.cohorts ?? []}
                onChange={(cohorts) => onChange({ ...draft, cohorts, cohort: "" })}
              />
            </div>
          </div>
        )}
      </section>

      <section className="cm-config-section">
        <h3>4. Assignment schedule</h3>
        <div className="cm-config-grid cm-schedule-grid">
          <label>
            Start date *
            <input
              type="date"
              aria-label="Start date"
              min={today}
              value={draft.start}
              onChange={(e) => onChange({ ...draft, start: e.target.value })}
            />
          </label>
          <div className="cm-end-date-block">
            <label className="cm-inline-check cm-end-date-check">
              <input
                type="checkbox"
                checked={!!draft.hasEndDate}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    hasEndDate: e.target.checked,
                    end: e.target.checked ? draft.end || draft.start : "",
                  })
                }
              />
              Set end date
            </label>
            {draft.hasEndDate ? (
              <label style={{ marginTop: 10 }}>
                End date *
                <input
                  type="date"
                  aria-label="End date"
                  min={draft.start || today}
                  value={draft.end}
                  onChange={(e) => onChange({ ...draft, end: e.target.value })}
                />
              </label>
            ) : (
              <p className="cm-field-help">
                No end date — assignment stays active until deactivated.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
