import { Data } from "./model";
import { Plan, WorkflowData } from "./workflowModel";
import { AssignmentSkills } from "./AssignmentSkills";
import { ManualAudience } from "./ManualAudience";

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
        <h3>2. Competencies & skills</h3>
        <AssignmentSkills
          data={data}
          selected={draft.skills}
          onChange={(skills) => onChange({ ...draft, skills })}
        />
      </section>
      <section className="cm-config-section">
        <h3>3. Enrolment & audience</h3>
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
            <p>Users must match every selected profile field.</p>
            <div className="cm-config-grid">
              {(["department", "role", "cohort"] as const).map((field) => (
                <label key={field}>
                  {field[0].toUpperCase() + field.slice(1)}
                  <select
                    aria-label={field[0].toUpperCase() + field.slice(1)}
                    value={draft[field] || ""}
                    onChange={(e) =>
                      onChange({
                        ...draft,
                        [field]: e.target.value,
                        location: "",
                      })
                    }
                  >
                    <option value="">Any {field}</option>
                    {[
                      ...new Set(
                        work.employees.map((e) => e[field]).filter(Boolean),
                      ),
                    ]
                      .sort()
                      .map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                  </select>
                </label>
              ))}
            </div>
          </div>
        )}
      </section>
      <section className="cm-config-section">
        <h3>4. Assignment schedule</h3>
        <div className="cm-config-grid">
          <label>
            Start date *
            <input
              type="date"
              aria-label="Start date"
              value={draft.start}
              onChange={(e) => onChange({ ...draft, start: e.target.value })}
            />
          </label>
          <div>
            <label className="cm-inline-check">
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
              <label>
                End date *
                <input
                  type="date"
                  aria-label="End date"
                  min={draft.start}
                  value={draft.end}
                  onChange={(e) => onChange({ ...draft, end: e.target.value })}
                />
              </label>
            ) : (
              <p className="cm-field-help">
                No end date. The assignment stays active until deactivated.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
