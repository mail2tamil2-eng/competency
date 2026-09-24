import { useMemo, useState } from "react";
import { Employee } from "./workflowModel";
import { ManagerPageSize, ManagerPagination } from "./ManagerPagination";

export function ManualAudience({
  employees,
  selected,
  onChange,
}: {
  employees: Employee[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState(""),
    [department, setDepartment] = useState(""),
    [role, setRole] = useState(""),
    [cohort, setCohort] = useState(""),
    [onlySelected, setOnlySelected] = useState(false),
    [page, setPage] = useState(0),
    [size, setSize] = useState(10);
  const ids = useMemo(() => new Set(selected), [selected]);
  const term = query.trim().toLowerCase();
  const matches = employees.filter(
    (e) =>
      (!department || e.department === department) &&
      (!role || e.role === role) &&
      (!cohort || e.cohort === cohort) &&
      (!onlySelected || ids.has(e.id)) &&
      (!term ||
        `${e.id} ${e.name} ${e.email || ""}`.toLowerCase().includes(term)),
  );
  const current = Math.min(
    page,
    Math.max(0, Math.ceil(matches.length / size) - 1),
  );
  const shown = matches.slice(current * size, (current + 1) * size);
  const add = (users: Employee[]) =>
    onChange([...new Set([...selected, ...users.map((e) => e.id)])]);
  return (
    <section
      className="cm-manual-audience"
      aria-label="Manual learner selection"
    >
      <h4>Select learners</h4>
      <p>
        Search by name, email or user ID. Selections stay selected when you
        change filters or pages.
      </p>
      <label>
        Search learners
        <input
          aria-label="Search learners"
          value={query}
          placeholder="Name, email or user ID"
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
        />
      </label>
      <div className="cm-config-grid">
        {(
          [
            ["Department", department, setDepartment, "department"],
            ["Role", role, setRole, "role"],
            ["Cohort", cohort, setCohort, "cohort"],
          ] as const
        ).map(([label, value, setter, field]) => (
          <label key={field}>
            {label}
            <select
              aria-label={`Filter learners by ${field}`}
              value={value}
              onChange={(e) => {
                setter(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All {label.toLowerCase()}s</option>
              {[...new Set(employees.map((e) => e[field]).filter(Boolean))]
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
      <div className="cm-selection-summary">
        <strong role="status">{selected.length} learners selected</strong>
        <span>{matches.length} matching users</span>
        <label className="cm-inline-check">
          <input
            type="checkbox"
            checked={onlySelected}
            onChange={(e) => {
              setOnlySelected(e.target.checked);
              setPage(0);
            }}
          />
          Selected learners only
        </label>
      </div>
      <div className="cm-actions cm-selection-actions">
        <button
          type="button"
          className="cm-button"
          disabled={!shown.length}
          onClick={() => add(shown)}
        >
          Select this page ({shown.length})
        </button>
        <button
          type="button"
          className="cm-button"
          disabled={!matches.length}
          onClick={() => add(matches)}
        >
          Select all matching ({matches.length})
        </button>
        <button
          type="button"
          className="cm-text-button"
          disabled={!selected.length}
          onClick={() => onChange([])}
        >
          Clear selection
        </button>
      </div>
      <ManagerPageSize
        value={size}
        onChange={(v) => {
          setSize(v);
          setPage(0);
        }}
      />
      <div
        className="cm-table-wrap"
        role="region"
        aria-label="Available learners"
        tabIndex={0}
      >
        <table>
          <thead>
            <tr>
              <th>Select</th>
              <th>Learner / email</th>
              <th>User ID</th>
              <th>Department / role</th>
              <th>Cohort</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((e) => (
              <tr key={e.id}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select ${e.name} (${e.id})`}
                    checked={ids.has(e.id)}
                    onChange={(event) =>
                      event.target.checked
                        ? add([e])
                        : onChange(selected.filter((id) => id !== e.id))
                    }
                  />
                </td>
                <td>
                  <strong>{e.name}</strong>
                  <small>{e.email || "Email not recorded"}</small>
                </td>
                <td>{e.id}</td>
                <td>
                  {e.department}
                  <small>{e.role}</small>
                </td>
                <td>{e.cohort || "Not recorded"}</td>
              </tr>
            ))}
            {!shown.length && (
              <tr>
                <td colSpan={5}>
                  No learners match. Change your search or filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ManagerPagination
        total={matches.length}
        page={current}
        pageSize={size}
        onPage={setPage}
      />
    </section>
  );
}
