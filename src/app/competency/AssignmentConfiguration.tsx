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
                Clear All
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
  step = 1,
}: {
  data: Data;
  work: WorkflowData;
  draft: Plan;
  onChange: (plan: Plan) => void;
  step?: 1 | 2;
}) {
  const allDepts     = [...new Set(work.employees.map((e) => e.department).filter(Boolean))].sort();
  const allRoles     = [...new Set(work.employees.map((e) => e.role).filter(Boolean))].sort();
  const allCohorts   = [...new Set(work.employees.map((e) => e.cohort).filter((v): v is string => Boolean(v)))].sort();
  const allLocations = [...new Set(work.employees.map((e) => e.location).filter(Boolean))].sort();
  const allVerticals = [...new Set(work.employees.map((e) => e.vertical).filter((v): v is string => Boolean(v)))].sort();

  return (
    <div className="cm-assignment-config">
      {step === 1 && <section className="cm-config-section">
        <h3>Assignment Details</h3>
        <label>
          <span className="cm-req-label">Assignment Name <span className="req">*</span></span>
          <input
            autoFocus
            aria-label="Assignment Name"
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
            placeholder="e.g. Sales communication skills"
          />
        </label>
        <h4>Competencies &amp; Skills</h4>
        <AssignmentSkills
          data={data}
          courses={work.courses}
          selected={draft.skills}
          onChange={(skills) => onChange({ ...draft, skills })}
        />
      </section>}

      {step === 2 && <section className="cm-config-section">
        <h3>Enrolment &amp; Audience</h3>
        <div className="cm-config-grid">
          <label>
            Method
            <select
              aria-label="Enrolment Method"
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
                ? "System automatically enrols users matching the profile below."
                : "You manually select which users are enrolled."}
            </small>
          </label>
          <label>
            Type
            <select
              aria-label="Enrolment Type"
              aria-describedby="enrolment-type-help"
              disabled={draft.method === "Manual"}
              value={draft.type}
              onChange={(e) => onChange({ ...draft, type: e.target.value as Plan["type"] })}
            >
              <option>Static</option>
              <option>Dynamic</option>
            </select>
            <small id="enrolment-type-help">
              {draft.type === "Static"
                ? "Assigns to existing matching users only."
                : "Assigns to current and future matching users."}
              {draft.method === "Manual" && " Fixed to Static for manual enrolment."}
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
            <h4>User Profile</h4>
            <div className="cm-scope-toggle">
              <button
                type="button"
                className={`cm-scope-btn${draft.allUsers ? " active" : ""}`}
                onClick={() => onChange({ ...draft, allUsers: true, departments: [], roles: [], cohorts: [], department: "", role: "", cohort: "" })}
              >
                All Users
              </button>
              <button
                type="button"
                className={`cm-scope-btn${!draft.allUsers ? " active" : ""}`}
                onClick={() => onChange({ ...draft, allUsers: false })}
              >
                Specific Audience
              </button>
            </div>
            {draft.allUsers ? (
              <div className="cm-audience-all-banner">
                <div className="cm-audience-all-stat">
                  <strong>{work.employees.length.toLocaleString()}</strong>
                  <span>employees</span>
                </div>
                <p>All users in the system will be enrolled in this assignment.</p>
              </div>
            ) : (
              <>
                <p>Users matching <strong>any</strong> value in each field will be enrolled.</p>
                <div className="cm-audience-fields cm-audience-fields-grid">
                  <ChipSelectField label="Department" field="department" options={allDepts}
                    selected={draft.departments ?? []}
                    onChange={(departments) => onChange({ ...draft, departments, department: "" })} />
                  <ChipSelectField label="Role" field="role" options={allRoles}
                    selected={draft.roles ?? []}
                    onChange={(roles) => onChange({ ...draft, roles, role: "" })} />
                  <ChipSelectField label="Cohort" field="cohort" options={allCohorts}
                    selected={draft.cohorts ?? []}
                    onChange={(cohorts) => onChange({ ...draft, cohorts, cohort: "" })} />
                  <ChipSelectField label="Location" field="location" options={allLocations}
                    selected={draft.locations ?? []}
                    onChange={(locations) => onChange({ ...draft, locations, location: "" })} />
                  <ChipSelectField label="Vertical" field="vertical" options={allVerticals}
                    selected={draft.verticals ?? []}
                    onChange={(verticals) => onChange({ ...draft, verticals })} />
                </div>
              </>
            )}
          </div>
        )}
      </section>}

      {step === 2 && <section className="cm-config-section">
        <h3>Schedule &amp; Learning Progression</h3>
        <div className="cm-config-grid cm-schedule-grid">
          <label>
            <span className="cm-req-label">Start Date <span className="req">*</span></span>
            <input
              type="date"
              aria-label="Start Date"
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
              End Date
            </label>
            {draft.hasEndDate ? (
              <input
                type="date"
                aria-label="End Date"
                min={draft.start || today}
                value={draft.end}
                onChange={(e) => onChange({ ...draft, end: e.target.value })}
              />
            ) : (
              <p className="cm-field-help">No end date — stays active until deactivated.</p>
            )}
          </div>
        </div>
        <label>
          Progression Type
          <select
            aria-label="Learning Progression Type"
            value={draft.progressionType || "level-wise"}
            onChange={(e) => onChange({ ...draft, progressionType: e.target.value as Plan["progressionType"] })}
          >
            <option value="level-wise">Level-Wise — L1 → L2 → L3 within each skill</option>
            <option value="skill-wise">Skill-Wise — complete one skill before the next</option>
            <option value="competency-wise">Competency-Wise — complete one competency before the next</option>
          </select>
          <small>
            {(!draft.progressionType || draft.progressionType === "level-wise") && "Each level must be completed before the next unlocks within the same skill."}
            {draft.progressionType === "skill-wise" && "Each skill must be completed before the next skill is unlocked."}
            {draft.progressionType === "competency-wise" && "Each competency must be completed before the next is unlocked."}
          </small>
        </label>
      </section>}
    </div>
  );
}
