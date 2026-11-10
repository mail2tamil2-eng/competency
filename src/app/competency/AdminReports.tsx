import { titleCaseLabel } from "./displayText";
import { useState } from "react";
import { ArrowLeft, Download, Search } from "lucide-react";
import { Data, Assignment, download, progress, compIdsOf, compNames } from "./model";
import { WorkflowData } from "./workflowModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { employeeFor, levelName, skillGap, proofStatus, personKey } from "./managerModel";
import { ManagerPageSize, ManagerPagination } from "./ManagerPagination";
import { StatusBadge } from "./ManagerProgress";

export const learnerReportHeaders = [
  "User ID", "Learner Name", "Email ID", "Role", "Department",
  "Reporting Manager", "Skill", "Current Level", "Expected Level",
  "Skill Gap", "Assigned Date", "Completed Date",
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
  const [coursePopup, setCoursePopup] = useState<{ assignmentId: string; skillId: string } | null>(null);

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
    const skill = data.skills.find((s) => s.id === a.skillId);
    if (term && ![a.name, emp?.email || "", a.department, emp?.role || "", skill?.name || "", compNames(data, skill)].join(" ").toLowerCase().includes(term)) return false;
    return true;
  });

  const total = rows.length;
  const cp = Math.min(page, Math.max(0, Math.ceil(total / size) - 1));

  const ctxLabel = ctx.kind === "skill"
    ? data.skills.find((s) => s.id === ctx.skillId)?.name || "Skill"
    : data.assignments.find((a) => personKey(a) === ctx.pKey)?.name || "Learner";
  /* Learner view: identity is shown once in the header instead of on every row. */
  const isLearner = ctx.kind === "learner";
  const learnerRow = isLearner ? data.assignments.find((a) => personKey(a) === ctx.pKey) : undefined;
  const learnerEmp = learnerRow ? employeeFor(work, learnerRow) : undefined;
  const learnerMgr = work.employees.find((e) => e.id === learnerEmp?.managerId);
  const headers = isLearner
    ? ["Competency", "Skill", "Current Level", "Expected Level", "Gap", "Courses", "Status", "Dates", "Proof"]
    : ["Name", "Email", "Role", "Dept", "Reporting Manager", "Skill", "Current Level", "Expected Level", "Gap", "Courses", "Status", "Dates", "Proof"];
  const filterLabel = ctx.filter === "gap" ? "with skill gap" : ctx.filter === "completed" ? "completed" : "all";

  function getCourseRows(a: Assignment) {
    const eIdx = data.levels.findIndex((l) => l.id === a.expected);
    if (eIdx < 0) return [];
    const done = work.completed[a.id] || [];
    const cIdx = data.levels.findIndex((l) => l.id === a.current);
    let firstRequired: string | null = null;
    for (const l of data.levels.slice(cIdx + 1, eIdx + 1)) {
      const c = work.courses.find((c) => c.mappings.some((m) => m.skillId === a.skillId && m.levelId === l.id) && !done.includes(c.id));
      if (c) { firstRequired = c.id; break; }
    }
    return data.levels.slice(0, eIdx + 1).flatMap((l) =>
      work.courses
        .filter((c) => c.mappings.some((m) => m.skillId === a.skillId && m.levelId === l.id))
        .map((c) => {
          const mapping = c.mappings.find((m) => m.skillId === a.skillId && m.levelId === l.id);
          const proof = work.proofs.filter((p) => p.assignmentId === a.id && p.courseId === c.id).at(-1);
          const courseStatus = done.includes(c.id) ? "Completed" : c.id === firstRequired ? "In Progress" : "Not Started";
          return { level: l, course: c, mandatory: mapping?.mandatory ?? false, courseStatus, proofStatus: proof?.status || "—" };
        }),
    );
  }

  function exportRows() {
    download("detail-report.csv", [
      ["Name", "Email", "Dept", "Role", "Reporting Manager", "Competency", "Skill", "Current Level", "Expected Level", "Skill Gap", "Courses", "Status", "Assigned Date", "Completed Date", "Proof Status"],
      ...rows.map((a) => {
        const emp = employeeFor(work, a);
        const mgr = work.employees.find((e) => e.id === emp?.managerId);
        const skill = data.skills.find((s) => s.id === a.skillId);
        const gap = skillGap(data, a);
        return [
          a.name, emp?.email || "Not recorded", a.department, emp?.role || "Not recorded",
          mgr?.name || "Not recorded", compNames(data, skill) || "—", skill?.name || "Unavailable",
          levelName(data, a.current), levelName(data, a.expected),
          gap ?? "Not assessed", getCourseRows(a).length, progress(data, a),
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
          <h2>{ctxLabel} — Detail View</h2>
          {isLearner && (
            <dl className="cm-report-profile">
              <div><dt>Email</dt><dd>{learnerEmp?.email || "Not recorded"}</dd></div>
              <div><dt>Role</dt><dd>{learnerEmp?.role || "Not recorded"}</dd></div>
              <div><dt>Department</dt><dd>{learnerRow?.department || "Not recorded"}</dd></div>
              <div><dt>Reporting Manager</dt><dd>{learnerMgr?.name || "Not recorded"}</dd></div>
            </dl>
          )}
          <p>Showing {filterLabel} records{ctx.filter !== "all" ? " only" : ""}.</p>
        </div>
        <button className="cm-button" onClick={exportRows}><Download size={16} /> Export CSV</button>
      </div>
      <div className="cm-toolbar cm-report-toolbar">
        <label className="cm-search">
          <Search size={16} />
          <input placeholder={isLearner ? "Search competency or skill…" : "Search name, email or skill…"} value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }} />
        </label>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}>
          <option value="">All Statuses</option>
          <option value="In Progress">In Progress</option>
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
      <div className="cm-table-wrap cm-detail-wrap" tabIndex={0} role="region" aria-label="Detail View Table">
        <table className={"cm-manager-table cm-detail-table" + (isLearner ? " is-learner" : "")}>
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{titleCaseLabel(h)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(cp * size, (cp + 1) * size).map((a) => {
              const emp = employeeFor(work, a);
              const mgr = work.employees.find((m) => m.id === emp?.managerId);
              const skill = data.skills.find((s) => s.id === a.skillId);
              const gap = skillGap(data, a);
              const courseCount = getCourseRows(a).length;
              return (
                <tr key={a.id}>
                  {!isLearner && (
                    <>
                      <td><strong>{a.name}</strong></td>
                      <td className="cm-cell-email">{emp?.email || "—"}</td>
                      <td>{emp?.role || "—"}</td>
                      <td>{a.department || "—"}</td>
                      <td>{mgr?.name || "—"}</td>
                    </>
                  )}
                  {isLearner && <td>{compNames(data, skill) || "—"}</td>}
                  <td><strong>{skill?.name || "Unavailable"}</strong></td>
                  <td>{levelName(data, a.current)}</td>
                  <td>{levelName(data, a.expected)}</td>
                  <td><strong className={gap ? "cm-manager-gap" : ""}>{gap ?? "Not assessed"}</strong></td>
                  <td>
                    {courseCount > 0 ? (
                      <button className="cm-link" onClick={() => setCoursePopup({ assignmentId: a.id, skillId: a.skillId })}>
                        {courseCount} Course{courseCount !== 1 ? "s" : ""}
                      </button>
                    ) : <span>—</span>}
                  </td>
                  <td><StatusBadge status={progress(data, a)} /></td>
                  <td className="cm-cell-dates">
                    <span><small>Assigned</small>{a.assignedDate?.slice(0, 10) || "—"}</span>
                    <span><small>Completed</small>{a.completedDate?.slice(0, 10) || "—"}</span>
                  </td>
                  <td><StatusBadge status={proofStatus(work, a.id)} /></td>
                </tr>
              );
            })}
            {!total && (
              <tr><td colSpan={headers.length}>No matching records. Try another search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <ManagerPagination total={total} page={cp} pageSize={size} onPage={setPage} />

      {/* Course detail popup */}
      {coursePopup && (() => {
        const a = data.assignments.find((x) => x.id === coursePopup.assignmentId);
        const skill = data.skills.find((s) => s.id === coursePopup.skillId);
        if (!a || !skill) return null;
        const courseRows = getCourseRows(a);
        return (
          <Dialog open onOpenChange={(open) => { if (!open) setCoursePopup(null); }}>
            <DialogContent className="cm-dialog cm-course-popup-dialog">
              <DialogHeader>
                <DialogTitle>{a.name} — {skill.name}</DialogTitle>
                <DialogDescription>Courses grouped by skill level</DialogDescription>
              </DialogHeader>
              <div className="cm-table-wrap">
                <table className="cm-manager-table">
                  <thead>
                    <tr>
                      <th>Skill Level</th>
                      <th>Course Name</th>
                      <th>Mandatory</th>
                      <th>Course Status</th>
                      <th>Proof Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseRows.map(({ level, course, mandatory, courseStatus, proofStatus: ps }) => (
                      <tr key={course.id + level.id}>
                        <td>{level.name}</td>
                        <td><strong>{course.name}</strong></td>
                        <td>
                          {mandatory
                            ? <span className="cm-manager-status success">Yes</span>
                            : <span className="cm-manager-status">No</span>}
                        </td>
                        <td><StatusBadge status={courseStatus} /></td>
                        <td>{ps === "—" ? <span className="cm-muted">—</span> : <StatusBadge status={ps} />}</td>
                      </tr>
                    ))}
                    {!courseRows.length && (
                      <tr><td colSpan={5}>No courses mapped for this skill.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="cm-dialog-actions">
                <button className="cm-button" onClick={() => setCoursePopup(null)}>Close</button>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
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
    return { skillId: s.id, skillName: s.name, compName: compNames(data, s) || "—", compIds: compIdsOf(s), enrolled, withGap, completed, pct, status };
  }).filter((r) => {
    if (filterComp && !r.compIds.includes(filterComp)) return false;
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
        <select aria-label="Filter Competency" value={filterComp} onChange={(e) => { setFilterComp(e.target.value); setPage(0); }}>
          <option value="">All Competencies</option>
          {data.competencies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select aria-label="Filter Department" value={filterDept} onChange={(e) => { setFilterDept(e.target.value); setPage(0); }}>
          <option value="">All Departments</option>
          {allDepts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select aria-label="Filter Role" value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setPage(0); }}>
          <option value="">All Job Roles</option>
          {allRoles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select aria-label="Filter Status" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}>
          <option value="">All Statuses</option>
          <option value="In Progress">In Progress</option>
          <option>Yet to Start</option>
          <option>Completed</option>
        </select>
        {hasFilters && <button className="cm-text-button" onClick={clearFilters}>Clear</button>}
        <button className="cm-button" style={{ marginLeft: 'auto' }} onClick={exportReport}><Download size={16} /> Export CSV</button>
      </div>
      <div className="cm-table-wrap" tabIndex={0} role="region" aria-label="Skill-Wise Report Table">
        <table>
          <thead>
            <tr>
              {["Skill", "Competency", "Enrolled Users", "Users with Skill Gap", "Completed Users", "Proficiency %", "Status"].map((h) => (
                <th key={h}>{titleCaseLabel(h)}</th>
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
                    {r.enrolled} Learner{r.enrolled !== 1 ? "s" : ""}
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
        <select aria-label="Filter Reporting Manager" value={filterManager} onChange={(e) => { setFilterManager(e.target.value); setPage(0); }}>
          <option value="">All Managers</option>
          {managerNames.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select aria-label="Filter Status" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}>
          <option value="">All Statuses</option>
          <option value="In Progress">In Progress</option>
          <option>Yet to Start</option>
          <option>Completed</option>
        </select>
        <span className="cm-date-range">
          <input type="date" value={filterAssignedFrom}
            onChange={(e) => { setFilterAssignedFrom(e.target.value); setPage(0); }}
            aria-label="Assigned From" />
          <span className="cm-date-range-sep">–</span>
          <input type="date" value={filterAssignedTo}
            onChange={(e) => { setFilterAssignedTo(e.target.value); setPage(0); }}
            aria-label="Assigned To" />
        </span>
        {hasFilters && <button className="cm-text-button" onClick={clearFilters}>Clear</button>}
        <button className="cm-button" style={{ marginLeft: 'auto' }} onClick={exportReport}><Download size={16} /> Export CSV</button>
      </div>
      <div className="cm-table-wrap" tabIndex={0} role="region" aria-label="Learner-Wise Report Table">
        <table>
          <thead>
            <tr>
              {["User ID", "Name", "Email", "Role", "Dept", "Reporting Manager", "Assigned Skills", "Skills with Gap", "Completed Skills", "Overall Progress"].map((h) => (
                <th key={h}>{titleCaseLabel(h)}</th>
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
          <h2>Skill Progress Reports</h2>
        </div>
      </div>
      <div className="cm-settings-tabs-bar">
        <div className="cm-settings-tabs" role="group" aria-label="Report Type">
          <button
            className={mode === "skill" ? "active" : ""}
            aria-pressed={mode === "skill"}
            onClick={() => { setMode("skill"); setDrill(null); }}
          >
            Skill-Wise Learner Progress
          </button>
          <button
            className={mode === "learner" ? "active" : ""}
            aria-pressed={mode === "learner"}
            onClick={() => { setMode("learner"); setDrill(null); }}
          >
            Learner-Wise Skill Report
          </button>
        </div>
      </div>
      {mode === "skill"
        ? <SkillReport data={data} work={work} onDrill={(skillId, filter) => setDrill({ kind: "skill", skillId, filter })} />
        : <LearnerReport data={data} work={work} onDrill={(pKey, filter) => setDrill({ kind: "learner", pKey, filter })} />}
    </section>
  );
}
