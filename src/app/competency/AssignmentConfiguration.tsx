import { Data } from "./model";
import { Plan, WorkflowData } from "./workflowModel";
import { AssignmentSkills } from "./AssignmentSkills";
import { ManualAudience } from "./ManualAudience";

const today = new Date().toLocaleDateString("en-CA");

function MultiCheckField({
  label,
  field,
  plural,
  options,
  selected,
  onChange,
}: {
  label: string;
  field: string;
  plural: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="cm-multi-check-field">
      <span className="cm-multi-check-label">{label}</span>
      {options.length === 0 ? (
        <small style={{ color: "#526176" }}>No {field} data available</small>
      ) : (
        <div className="cm-checks">
          {options.map((v) => (
            <label key={v} className="cm-inline-check">
              <input
                type="checkbox"
                checked={selected.includes(v)}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...selected, v]
                      : selected.filter((x) => x !== v),
                  )
                }
              />
              {v}
            </label>
          ))}
        </div>
      )}
      {selected.length > 0 && (
        <small style={{ color: "#2463d6" }}>
          {selected.length} selected:{" "}
          {selected.join(", ")}
        </small>
      )}
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
            <p>Users matching <strong>any</strong> selection in each field will be enrolled. Leave a field empty to include all.</p>
            <div className="cm-audience-fields">
              <MultiCheckField
                label="Department"
                field="department"
                plural="departments"
                options={allDepts}
                selected={draft.departments ?? []}
                onChange={(departments) => onChange({ ...draft, departments, department: "" })}
              />
              <MultiCheckField
                label="Role"
                field="role"
                plural="roles"
                options={allRoles}
                selected={draft.roles ?? []}
                onChange={(roles) => onChange({ ...draft, roles, role: "" })}
              />
              <MultiCheckField
                label="Cohort"
                field="cohort"
                plural="cohorts"
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
