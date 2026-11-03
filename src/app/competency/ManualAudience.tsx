import { useMemo, useState } from "react";
import { Search } from "lucide-react";
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

  const [location, setLocation] = useState(""),
        [vertical, setVertical]   = useState("");

  const allDepts     = useMemo(() => [...new Set(employees.map(e => e.department).filter(Boolean))].sort(), [employees]);
  const allRoles     = useMemo(() => [...new Set(employees.map(e => e.role).filter(Boolean))].sort(), [employees]);
  const allCohorts   = useMemo(() => [...new Set(employees.map(e => e.cohort).filter((v): v is string => Boolean(v)))].sort(), [employees]);
  const allLocations = useMemo(() => [...new Set(employees.map(e => e.location).filter(Boolean))].sort(), [employees]);
  const allVerticals = useMemo(() => [...new Set(employees.map(e => e.vertical).filter((v): v is string => Boolean(v)))].sort(), [employees]);

  const matches = employees.filter(
    (e) =>
      (!department || e.department === department) &&
      (!role || e.role === role) &&
      (!cohort || e.cohort === cohort) &&
      (!location || e.location === location) &&
      (!vertical || e.vertical === vertical) &&
      (!onlySelected || ids.has(e.id)) &&
      (!term || `${e.id} ${e.name} ${e.email || ""}`.toLowerCase().includes(term)),
  );

  const current = Math.min(page, Math.max(0, Math.ceil(matches.length / size) - 1));
  const shown = matches.slice(current * size, (current + 1) * size);
  const add = (users: Employee[]) =>
    onChange([...new Set([...selected, ...users.map((e) => e.id)])]);

  return (
    <section className="cm-manual-audience" aria-label="Manual Learner Selection">
      <h4>Select Learners</h4>
      <p>Search by name, email or ID. Selections persist when you change filters or pages.</p>

      {/* ── Zone 1: Search + Filters ── */}
      <div className="cm-audience-search-bar">
        <div className="cm-search cm-audience-search-input">
          <Search size={15} />
          <input
            aria-label="Search Learners"
            value={query}
            placeholder="Name, email or ID…"
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
          />
        </div>
        <select
          aria-label="Filter by department"
          value={department}
          onChange={(e) => { setDepartment(e.target.value); setPage(0); }}
        >
          <option value="">All Departments</option>
          {allDepts.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select
          aria-label="Filter by role"
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(0); }}
        >
          <option value="">All Roles</option>
          {allRoles.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select
          aria-label="Filter by cohort"
          value={cohort}
          onChange={(e) => { setCohort(e.target.value); setPage(0); }}
        >
          <option value="">All Cohorts</option>
          {allCohorts.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select
          aria-label="Filter by location"
          value={location}
          onChange={(e) => { setLocation(e.target.value); setPage(0); }}
        >
          <option value="">All Locations</option>
          {allLocations.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select
          aria-label="Filter by vertical"
          value={vertical}
          onChange={(e) => { setVertical(e.target.value); setPage(0); }}
        >
          <option value="">All Verticals</option>
          {allVerticals.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>

      {/* ── Zone 2: Toolbar — stats left, actions right ── */}
      <div className="cm-audience-toolbar">
        <div className="cm-audience-stats">
          <span className="cm-audience-selected-count">{selected.length} Selected</span>
          <span className="cm-audience-sep">·</span>
          <span className="cm-audience-match-count">{matches.length} Matching</span>
          <label className="cm-inline-check cm-audience-only-toggle">
            <input
              type="checkbox"
              checked={onlySelected}
              onChange={(e) => { setOnlySelected(e.target.checked); setPage(0); }}
            />
            Selected only
          </label>
        </div>
        <div className="cm-audience-bulk">
          <button
            type="button"
            className="cm-button cm-audience-bulk-btn"
            disabled={!shown.length}
            onClick={() => add(shown)}
          >
            Select Page ({shown.length})
          </button>
          <button
            type="button"
            className="cm-button cm-audience-bulk-btn"
            disabled={!matches.length}
            onClick={() => add(matches)}
          >
            Select All ({matches.length})
          </button>
          <button
            type="button"
            className="cm-text-button"
            disabled={!selected.length}
            onClick={() => onChange([])}
          >
            Clear
          </button>
        </div>
      </div>

      {/* ── Zone 3: Learner table ── */}
      <div className="cm-table-wrap" role="region" aria-label="Available Learners" tabIndex={0}>
        <table>
          <thead>
            <tr>
              <th className="cm-col-check"> </th>
              <th>Name &amp; Email</th>
              <th>ID</th>
              <th>Department / Role</th>
              <th>Cohort</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((e) => (
              <tr key={e.id} className={ids.has(e.id) ? "cm-row-selected" : ""}>
                <td className="cm-col-check">
                  <input
                    type="checkbox"
                    aria-label={`Select ${e.name}`}
                    checked={ids.has(e.id)}
                    onChange={(ev) =>
                      ev.target.checked
                        ? add([e])
                        : onChange(selected.filter((id) => id !== e.id))
                    }
                  />
                </td>
                <td>
                  <strong>{e.name}</strong>
                  <small>{e.email || "—"}</small>
                </td>
                <td className="cm-cell-muted">{e.id}</td>
                <td>
                  {e.department}
                  <small>{e.role}</small>
                </td>
                <td>{e.cohort || "—"}</td>
              </tr>
            ))}
            {!shown.length && (
              <tr>
                <td colSpan={5} className="cm-table-empty">
                  No learners match. Adjust your search or filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Zone 4: Footer — page size + pagination ── */}
      <div className="cm-audience-footer">
        <ManagerPageSize value={size} onChange={(v) => { setSize(v); setPage(0); }} />
        <ManagerPagination total={matches.length} page={current} pageSize={size} onPage={setPage} />
      </div>
    </section>
  );
}
