import { useState } from "react";
import { ArrowLeft, Download, Search } from "lucide-react";
import { Data, download, progress } from "./model";
import { WorkflowData } from "./workflowModel";
import { employeeFor, levelName, skillGap, proofStatus, personKey } from "./managerModel";
import { ManagerPageSize, ManagerPagination } from "./ManagerPagination";
import { StatusBadge } from "./ManagerProgress";

export const learnerReportHeaders = [
  "User ID", "Learner name", "Email ID", "Role", "Department",
  "Reporting manager", "Skill", "Current level", "Expected level",
  "Skill gap", "Assigned date", "Completed date",
];

export function learnerReportRows(data: Data, work: WorkflowData) {
  return data.assignments.map((a) => {
    const employee = employeeFor(work, a);
    const manager = work.employees.find((e) => e.id === employee?.managerId);
    return {
      id: a.id,
      skillId: a.skillId,
      cells: [
        employee?.id || a.employeeId || "Not recorded",
        a.name,
        employee?.email || "Not recorded",
        employee?.role || "Not recorded",
        employee?.department || a.department,
        manager?.name || "Not recorded",
        data.skills.find((s) => s.id === a.skillId)?.name || "Unavailable skill",
        levelName(data, a.current),
        levelName(data, a.expected),
        skillGap(data, a) ?? "Not assessed",
        a.assignedDate?.slice(0, 10) || "Not recorded",
        a.completedDate?.slice(0, 10) || "Not recorded",
      ],
    };
  });
}

// --- Shared detail view used by both drill-downs ---
type DrillContext =
  | { kind: "skill"; skillId: string; filter: "all" | "gap" | "completed" }
  | { kind: "learner"; pKey: string; filter: "all" | "gap" | "completed" };

function DetailView({
  data, work, ctx, onBack,
}: {
  data: Data;
  work: WorkflowData;
  ctx: DrillContext;
  onBack: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const assignments = data.assignments.filter((a) => {
    if (ctx.kind === "skill" && a.skillId !== ctx.skillId) return false;
    if (ctx.kind === "learner" && personKey(a) !== ctx.pKey) return false;
    const st = progress(data, a);
    if (ctx.filter === "gap") return st !== "Completed";
    if (ctx.filter === "completed") return st === "Completed";
    return true;
  });

  const rows = assignments.filter((a) => {
    const emp = employeeFor(work, a);
    if (filterStatus && progress(data, a) !== filterStatus) return false;
    const term = query.trim().toLowerCase();
    if (term && ![a.name, emp?.email || "", a.department, emp?.role || "", data.skills.find((s) => s.id === a.skillId)?.name || ""].join(" ").toLowerCase().includes(term)) return false;
    return true;
  });

  const total = rows.length;
  const cp = Math.min(page, Math.max(0, Math.ceil(total / size) - 1));

  const ctxLabel = ctx.kind === "skill"
    ? data.skills.find((s) => s.id === ctx.skillId)?.name || "Skill"
    : data.assignments.find((a) => personKey(a) === ctx.pKey)?.name || "Learner";
  const filterLabel = ctx.filter === "gap" ? "with skill gap" : ctx.filter === "completed" ? "completed" : "all";

  function exportRows() {
    download("detail-report.csv", [
      ["Name", "Email", "Dept", "Role", "Reporting Manager", "Skill", "Competency", "Current Level", "Expected Level", "Skill Gap", "Status", "Assigned Date", "Completed Date", "Proof Status"],
      ...rows.map((a) => {
        const emp = employeeFor(work, a);
        const mgr = work.employees.find((e) => e.id === emp?.managerId);
        const skill = data.skills.find((s) => s.id === a.skillId);
        const comp = data.competencies.find((c) => c.id === skill?.competencyId);
        const gap = skillGap(data, a);
        return [
          a.name, emp?.email || "Not recorded", a.department, emp?.role || "Not recorded",
          mgr?.name || "Not recorded", skill?.name || "Unavailable", comp?.name || "Not recorded",
          levelName(data, a.current), levelName(data, a.expected),
          gap ?? "Not assessed", progress(data, a),
          a.assignedDate?.slice(0, 10) || "—", a.completedDate?.slice(0, 10) || "—",
          proofStatus(work, a.id),
        ].map(String);
      }),
    ]);
  }

  return (
    <section className="cm-card">
      <div className="cm-actions" style={{ marginBottom: 8 }}>
        <button className="cm-button" onClick={onBack}><ArrowLeft size={16} /> Back</button>
      </div>
      <div className="cm-section-head">
        <div>
          <h2>{ctxLabel} — detail view</h2>
          <p>Showing {filterLabel} records{ctx.filter !== "all" ? " only" : ""}.</p>
        </div>
        <button className="cm-button" onClick={exportRows}><Download size={16} /> Export CSV</button>
      </div>
      <div className="cm-toolbar cm-report-toolbar">
        <label className="cm-search">
          <Search size={16} />
          <input placeholder="Search name, email or skill…" value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }} />
        </label>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}>
          <option value="">All statuses</option>
          <option>In Progress</option>
          <option>Yet to Start</option>
          <option>Completed</option>
        </select>
        {(query || filterStatus) && (
          <button className="cm-text-button" onClick={() => { setQuery(""); setFilterStatus(""); setPage(0); }}>Clear</button>
        )}
      </div>
      <div className="cm-table-controls">
        <ManagerPageSize value={size} onChange={(v) => { setSize(v); setPage(0); }} />
        <p className="cm-manager-caption">{total} records</p>
      </div>
      <div className="cm-table-wrap" tabIndex={0} role="region" aria-label="Detail view table">
        <table className="cm-manager-table">
          <thead>
            <tr>
              {["Name", "Email", "Role", "Skill", "Competency", "Current Level", "Expected Level", "Gap", "Status", "Assigned", "Completed", "Proof"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(cp * size, (cp + 1) * size).map((a) => {
              const emp = employeeFor(work, a);
              const skill = data.skills.find((s) => s.id === a.skillId);
              const comp = data.competencies.find((c) => c.id === skill?.competencyId);
              const gap = skillGap(data, a);
              return (
                <tr key={a.id}>
                  <td><strong>{a.name}</strong><small>{a.department}</small></td>
                  <td>{emp?.email || "—"}</td>
                  <td>{emp?.role || "—"}</td>
                  <td><strong>{skill?.name || "Unavailable"}</strong></td>
                  <td>{comp?.name || "—"}</td>
                  <td>{levelName(data, a.current)}</td>
                  <td>{levelName(data, a.expected)}</td>
                  <td><strong className={gap ? "cm-manager-gap" : ""}>{gap ?? "Not assessed"}</strong></td>
                  <td><StatusBadge status={progress(data, a)} /></td>
                  <td>{a.assignedDate?.slice(0, 10) || "—"}</td>
                  <td>{a.completedDate?.slice(0, 10) || "—"}</td>
                  <td><StatusBadge status={proofStatus(work, a.id)} /></td>
                </tr>
              );
            })}
            {!total && (
              <tr><td colSpan={12}>No matching records. Try another search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <ManagerPagination total={total} page={cp} pageSize={size} onPage={setPage} />
    </section>
  );
}

// --- Report 1: Skill-wise ---
function SkillReport({
  data, work, onDrill,
}: {
  data: Data;
  work: WorkflowData;
  onDrill: (skillId: string, filter: "all" | "gap" | "completed") => void;
}) {
  const [filterComp, setFilterComp] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const allDepts = [...new Set(work.employees.map((e) => e.department).filter(Boolean))].sort();
  const allRoles = [...new Set(work.employees.map((e) => e.role).filter(Boolean))].sort();

  const rows = data.skills.map((s) => {
    const comp = data.competencies.find((c) => c.id === s.competencyId);
    const all = data.assignments.filter((a) => {
      if (a.skillId !== s.id) return false;
      if (filterDept || filterRole) {
        const emp = employeeFor(work, a);
        if (filterDept && emp?.department !== filterDept) return false;
        if (filterRole && emp?.role !== filterRole) return false;
      }
      return true;
    });
    const enrolled = all.length;
    const completed = all.filter((a) => progress(data, a) === "Completed").length;
    const withGap = enrolled - completed;
    const pct = enrolled ? Math.round((completed / enrolled) * 100) : 0;
    const status: string = enrolled === 0
      ? "Yet to Start"
      : completed === enrolled
        ? "Completed"
        : "In Progress";
    return { skillId: s.id, skillName: s.name, compName: comp?.name || "—", compId: s.competencyId || "", enrolled, withGap, completed, pct, status };
  }).filter((r) => {
    if (filterComp && r.compId !== filterComp) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    const term = query.trim().toLowerCase();
    if (term && !r.skillName.toLowerCase().includes(term) && !r.compName.toLowerCase().includes(term)) return false;
    return true;
  });

  const total = rows.length;
  const cp = Math.min(page, Math.max(0, Math.ceil(total / size) - 1));
  const hasFilters = !!(filterComp || filterDept || filterRole || filterStatus || query);

  function clearFilters() {
    setFilterComp(""); setFilterDept(""); setFilterRole(""); setFilterStatus(""); setQuery(""); setPage(0);
  }

  function exportReport() {
    download("skill-wise-report.csv", [
      ["Skill", "Competency", "Enrolled Users", "Users with Skill Gap", "Completed Users", "Proficiency %", "Status"],
      ...rows.map((r) => [r.skillName, r.compName, r.enrolled, r.withGap, r.completed, r.pct + "%", r.status].map(String)),
    ]);
  }

  return (
    <div>
      <div className="cm-report-filters">
        <label className="cm-search">
          <Search size={16} />
          <input placeholder="Search skill or competency…" value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }} />
        </label>
        <select aria-label="Filter competency" value={filterComp} onChange={(e) => { setFilterComp(e.target.value); setPage(0); }}>
          <option value="">All competencies</option>
          {data.competencies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select aria-label="Filter department" value={filterDept} onChange={(e) => { setFilterDept(e.target.value); setPage(0); }}>
          <option value="">All departments</option>
          {allDepts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select aria-label="Filter role" value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setPage(0); }}>
          <option value="">All job roles</option>
          {allRoles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select aria-label="Filter status" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}>
          <option value="">All statuses</option>
          <option>In Progress</option>
          <option>Yet to Start</option>
          <option>Completed</option>
        </select>
        {hasFilters && <button className="cm-text-button" onClick={clearFilters}>Clear</button>}
        <button className="cm-button" onClick={exportReport}><Download size={16} /> Export CSV</button>
      </div>
      <div className="cm-table-wrap" tabIndex={0} role="region" aria-label="Skill-wise report table">
        <table>
          <thead>
            <tr>
              {["Skill", "Competency", "Enrolled Users", "Users with Skill Gap", "Completed Users", "Proficiency %", "Status"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(cp * size, (cp + 1) * size).map((r) => (
              <tr key={r.skillId}>
                <td><strong>{r.skillName}</strong></td>
                <td>{r.compName}</td>
                <td>
                  <button className="cm-link" onClick={() => onDrill(r.skillId, "all")}>
                    {r.enrolled} learner{r.enrolled !== 1 ? "s" : ""}
                  </button>
                </td>
                <td>
                  {r.withGap > 0
                    ? <button className="cm-link cm-manager-gap" onClick={() => onDrill(r.skillId, "gap")}>{r.withGap}</button>
                    : <span>{r.withGap}</span>}
                </td>
                <td>
                  {r.completed > 0
                    ? <button className="cm-link" onClick={() => onDrill(r.skillId, "completed")}>{r.completed}</button>
                    : <span>{r.completed}</span>}
                </td>
                <td>{r.pct}%</td>
                <td><StatusBadge status={r.status} /></td>
              </tr>
            ))}
            {!total && (
              <tr><td colSpan={7}>No matching skills. Try another search or clear the filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="cm-report-footer">
        <ManagerPageSize value={size} onChange={(v) => { setSize(v); setPage(0); }} />
        <ManagerPagination total={total} page={cp} pageSize={size} onPage={setPage} />
      </div>
    </div>
  );
}

// --- Report 2: Learner-wise summary ---
function LearnerReport({
  data, work, onDrill,
}: {
  data: Data;
  work: WorkflowData;
  onDrill: (pKey: string, filter: "all" | "gap" | "completed") => void;
}) {
  const [query, setQuery] = useState("");
  const [filterManager, setFilterManager] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAssignedFrom, setFilterAssignedFrom] = useState("");
  const [filterAssignedTo, setFilterAssignedTo] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const managerNames = [...new Set(
    data.assignments.map((a) => {
      const emp = employeeFor(work, a);
      const mgr = work.employees.find((m) => m.id === emp?.managerId);
      return mgr?.name || "";
    }).filter(Boolean),
  )].sort();

  const personMap = new Map<string, typeof data.assignments>();
  for (const a of data.assignments) {
    const pk = personKey(a);
    if (!personMap.has(pk)) personMap.set(pk, []);
    personMap.get(pk)!.push(a);
  }

  const rows = [...personMap.entries()].map(([pk, items]) => {
    const first = items[0];
    const emp = employeeFor(work, first);
    const mgr = work.employees.find((m) => m.id === emp?.managerId);
    const assigned = items.length;
    const completed = items.filter((a) => progress(data, a) === "Completed").length;
    const withGap = assigned - completed;
    const pct = assigned ? Math.round((completed / assigned) * 100) : 0;
    const overallStatus = assigned === 0
      ? "Yet to Start"
      : completed === assigned
        ? "Completed"
        : items.some((a) => a.current || progress(data, a) === "In Progress")
          ? "In Progress"
          : "Yet to Start";
    const earliestAssigned = items
      .map((a) => a.assignedDate?.slice(0, 10))
      .filter(Boolean)
      .sort()[0] || "";
    return { pk, userId: emp?.id || first.employeeId || "—", name: first.name, email: emp?.email || "Not recorded", role: emp?.role || "Not recorded", dept: first.department, manager: mgr?.name || "Not recorded", assigned, withGap, completed, pct, overallStatus, earliestAssigned };
  }).filter((r) => {
    if (filterManager && r.manager !== filterManager) return false;
    if (filterStatus && r.overallStatus !== filterStatus) return false;
    if (filterAssignedFrom && r.earliestAssigned && r.earliestAssigned < filterAssignedFrom) return false;
    if (filterAssignedTo && r.earliestAssigned && r.earliestAssigned > filterAssignedTo) return false;
    const term = query.trim().toLowerCase();
    if (term && ![r.name, r.email, r.role, r.dept, r.manager].join(" ").toLowerCase().includes(term)) return false;
    return true;
  });

  const total = rows.length;
  const cp = Math.min(page, Math.max(0, Math.ceil(total / size) - 1));
  const hasFilters = !!(filterManager || filterStatus || filterAssignedFrom || filterAssignedTo || query);

  function clearFilters() {
    setQuery(""); setFilterManager(""); setFilterStatus(""); setFilterAssignedFrom(""); setFilterAssignedTo(""); setPage(0);
  }

  function exportReport() {
    download("learner-wise-report.csv", [
      ["User ID", "Name", "Email", "Role", "Department", "Reporting Manager", "Assigned Skills", "Skills with Gap", "Completed Skills", "Overall Progress %"],
      ...rows.map((r) => [r.userId, r.name, r.email, r.role, r.dept, r.manager, r.assigned, r.withGap, r.completed, r.pct + "%"].map(String)),
    ]);
  }

  return (
    <div>
      <div className="cm-report-filters">
        <label className="cm-search">
          <Search size={16} />
          <input placeholder="Search name, email or department…" value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }} />
        </label>
        <select aria-label="Filter reporting manager" value={filterManager} onChange={(e) => { setFilterManager(e.target.value); setPage(0); }}>
          <option value="">All managers</option>
          {managerNames.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select aria-label="Filter status" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}>
          <option value="">All statuses</option>
          <option>In Progress</option>
          <option>Yet to Start</option>
          <option>Completed</option>
        </select>
        <span className="cm-date-range">
          <input type="date" value={filterAssignedFrom}
            onChange={(e) => { setFilterAssignedFrom(e.target.value); setPage(0); }}
            aria-label="Assigned from" />
          <span className="cm-date-range-sep">–</span>
          <input type="date" value={filterAssignedTo}
            onChange={(e) => { setFilterAssignedTo(e.target.value); setPage(0); }}
            aria-label="Assigned to" />
        </span>
        {hasFilters && <button className="cm-text-button" onClick={clearFilters}>Clear</button>}
        <button className="cm-button" onClick={exportReport}><Download size={16} /> Export CSV</button>
      </div>
      <div className="cm-table-wrap" tabIndex={0} role="region" aria-label="Learner-wise report table">
        <table>
          <thead>
            <tr>
              {["User ID", "Name", "Email", "Role", "Dept", "Reporting Manager", "Assigned Skills", "Skills with Gap", "Completed Skills", "Overall Progress"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(cp * size, (cp + 1) * size).map((r) => (
              <tr key={r.pk}>
                <td>{r.userId}</td>
                <td><strong>{r.name}</strong><small>{r.dept}</small></td>
                <td>{r.email}</td>
                <td>{r.role}</td>
                <td>{r.dept}</td>
                <td>{r.manager}</td>
                <td><button className="cm-link" onClick={() => onDrill(r.pk, "all")}>{r.assigned}</button></td>
                <td>
                  {r.withGap > 0
                    ? <button className="cm-link cm-manager-gap" onClick={() => onDrill(r.pk, "gap")}>{r.withGap}</button>
                    : <span>{r.withGap}</span>}
                </td>
                <td>
                  {r.completed > 0
                    ? <button className="cm-link" onClick={() => onDrill(r.pk, "completed")}>{r.completed}</button>
                    : <span>{r.completed}</span>}
                </td>
                <td>
                  <div className="cm-manager-completion">
                    <strong>{r.pct}%</strong>
                    <progress max={100} value={r.pct} aria-label={`${r.name} overall progress`} />
                  </div>
                </td>
              </tr>
            ))}
            {!total && (
              <tr><td colSpan={10}>No matching learners. Try another search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="cm-report-footer">
        <ManagerPageSize value={size} onChange={(v) => { setSize(v); setPage(0); }} />
        <ManagerPagination total={total} page={cp} pageSize={size} onPage={setPage} />
      </div>
    </div>
  );
}

// --- Main Reports component ---
export function Reports({ data, work }: { data: Data; work: WorkflowData }) {
  const [mode, setMode] = useState<"skill" | "learner">("skill");
  const [drill, setDrill] = useState<DrillContext | null>(null);

  if (drill) {
    return (
      <DetailView
        data={data}
        work={work}
        ctx={drill}
        onBack={() => setDrill(null)}
      />
    );
  }

  return (
    <section className="cm-card">
      <div className="cm-section-head">
        <div>
          <h2>Skill progress reports</h2>
        </div>
      </div>
      <div className="cm-settings-tabs-bar">
        <div className="cm-settings-tabs" role="group" aria-label="Report type">
          <button
            className={mode === "skill" ? "active" : ""}
            aria-pressed={mode === "skill"}
            onClick={() => { setMode("skill"); setDrill(null); }}
          >
            Skill-wise learner progress
          </button>
          <button
            className={mode === "learner" ? "active" : ""}
            aria-pressed={mode === "learner"}
            onClick={() => { setMode("learner"); setDrill(null); }}
          >
            Learner-wise skill report
          </button>
        </div>
      </div>
      {mode === "skill"
        ? <SkillReport data={data} work={work} onDrill={(skillId, filter) => setDrill({ kind: "skill", skillId, filter })} />
        : <LearnerReport data={data} work={work} onDrill={(pKey, filter) => setDrill({ kind: "learner", pKey, filter })} />}
    </section>
  );
}
