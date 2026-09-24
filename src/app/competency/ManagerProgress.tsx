import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { ManagerProofs } from "./ManagerProofs";
import { ManagerNavigation } from "./ManagerNavigation";
import { ManagerPagination, ManagerPageSize } from "./ManagerPagination";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Search,
  Users,
  CheckCircle2,
  ClipboardCheck,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { Assignment, Data, download, progress } from "./model";
import { WorkflowData } from "./workflowModel";
import {
  detailedHeaders,
  detailedRows,
  employeeFor,
  exportWorkbook,
  latestProofs,
  levelName,
  personKey,
  skillGap,
} from "./managerModel";
import { ManagerSkillDialog } from "./ManagerReview";
import "./manager.css";

export type ManagerProps = {
  data: Data;
  work: WorkflowData;
  save: (data: Data, work: WorkflowData, message: string) => boolean;
};
export function ManagerProgress({ data, work, save }: ManagerProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const view = location.pathname.endsWith("/reportees")
    ? "all"
    : location.pathname.endsWith("/reportee")
      ? "detail"
      : "summary";
  const person = new URLSearchParams(location.search).get("person") || "";
  const [query, setQuery] = useState("");
  const [competency, setCompetency] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [entries, setEntries] = useState(10);
  const [editing, setEditing] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const skill = (a: Assignment) => data.skills.find((s) => s.id === a.skillId);
  const competencyName = (a: Assignment) =>
    data.competencies.find((c) => c.id === skill(a)?.competencyId)?.name ||
    "Unavailable";
  const groups = new Map<string, Assignment[]>();
  data.assignments.forEach((a) =>
    groups.set(personKey(a), [...(groups.get(personKey(a)) || []), a]),
  );
  // This workspace is a manager preview. Real reportee scope must come from the authenticated backend.
  const personRows = groups.get(person) || [];
  const selectedPerson = personRows[0];
  const scoped = view === "detail" ? personRows : data.assignments;
  const rows = scoped.filter(
    (a) =>
      (!competency || skill(a)?.competencyId === competency) &&
      (!status || progress(data, a) === status) &&
      `${a.name} ${employeeFor(work, a)?.email || ""} ${a.department} ${skill(a)?.name} ${competencyName(a)}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const visibleGroups = [...groups.entries()]
    .map(([id, items]) => [id, items.filter((a) => rows.includes(a))] as const)
    .filter(([, items]) => items.length);
  const total = view === "detail" ? rows.length : visibleGroups.length;
  const pageSize = view === "summary" ? 5 : entries;
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(total / pageSize) - 1),
  );
  const pending = data.assignments.reduce(
    (count, a) =>
      count +
      latestProofs(work, a.id).filter((p) => p.status === "Under Review")
        .length,
    0,
  );
  const completed = scoped.filter(
    (a) => progress(data, a) === "Completed",
  ).length;
  const percent = scoped.length
    ? Math.round((completed / scoped.length) * 100)
    : 0;
  function go(next: typeof view, id = "") {
    navigate(
      `/competency-management/manager${next === "all" ? "/reportees" : next === "detail" ? `/reportee?person=${encodeURIComponent(id)}` : ""}`,
    );
    setQuery("");
    setStatus("");
    setPage(0);
  }
  async function exportReport(format: "csv" | "xlsx") {
    setExporting(true);
    try {
      const records = detailedRows(data, work, rows);
      if (format === "csv")
        download("team-skill-progress-detailed.csv", [
          detailedHeaders,
          ...records.map((r) => r.map(String)),
        ]);
      else await exportWorkbook(records);
      toast.success(`Exported ${records.length} skill records`);
    } catch {
      toast.error("Unable to export the report. Please try again.");
    } finally {
      setExporting(false);
    }
  }
  if (location.pathname.endsWith("/proofs"))
    return <ManagerProofs data={data} work={work} save={save} />;
  return (
    <div className="cm-manager">
      {view !== "summary" && (
        <div className="cm-actions">
          <button
            className="cm-button"
            onClick={() => go(view === "detail" ? "all" : "summary")}
          >
            <ArrowLeft size={16} />
            {view === "detail"
              ? "Back to all reportees"
              : "Back to team overview"}
          </button>
        </div>
      )}
      {view === "summary" && <ManagerNavigation />}
      {view !== "summary" && (
        <nav
          className="cm-manager-breadcrumb"
          aria-label="Team progress navigation"
        >
          <button onClick={() => go("summary")}>Team overview</button>
          <span>/</span>
          {view === "detail" ? (
            <>
              <button onClick={() => go("all")}>All reportees</button>
              <span>/</span>
              <span>{selectedPerson?.name}</span>
            </>
          ) : (
            <span>All reportees</span>
          )}
        </nav>
      )}
      {view === "summary" && (
        <div className="cm-manager-stats">
          {[
            ["Reportees", groups.size, Users, "Across all competencies"],
            [
              "Completed skills",
              completed,
              CheckCircle2,
              `${scoped.length} total assigned skills`,
            ],
            [
              "Completion",
              scoped.length ? `${percent}%` : "—",
              Target,
              "Completed ÷ assigned skills",
            ],
            [
              "Proofs awaiting review",
              pending,
              ClipboardCheck,
              "Submissions needing a decision",
            ],
          ].map(([label, value, Icon, hint]) => {
            const Symbol = Icon as typeof Users;
            return (
              <article key={String(label)}>
                <div>
                  <span>{String(label)}</span>
                  <Symbol size={18} />
                </div>
                <strong>{String(value)}</strong>
                <small>{String(hint)}</small>
              </article>
            );
          })}
        </div>
      )}
      <section className="cm-card">
        <div className="cm-section-head">
          <div>
            <h3>
              {view === "detail"
                ? `${selectedPerson?.name || "Reportee"} — Skills & progress`
                : view === "all"
                  ? "All reportees"
                  : "Team Skill Progress"}
            </h3>
            <p>
              {view === "detail"
                ? `${selectedPerson ? employeeFor(work, selectedPerson)?.email || "Email not recorded" : ""} · Compare proficiency and use Update level to record an assessment.`
                : "Select View skills to see a reportee’s proficiency and progress."}
            </p>
          </div>
          {view === "summary" ? (
            <button className="cm-text-button" onClick={() => go("all")}>
              View all <ArrowRight size={16} />
            </button>
          ) : (
            <div className="cm-actions">
              <button
                className="cm-button"
                disabled={!rows.length || exporting}
                onClick={() => exportReport("csv")}
              >
                <Download size={16} />
                Export CSV
              </button>
              <button
                className="cm-button"
                disabled={!rows.length || exporting}
                onClick={() => exportReport("xlsx")}
              >
                <Download size={16} />
                {exporting ? "Exporting…" : "Export XLSX"}
              </button>
            </div>
          )}
        </div>
        <div className="cm-manager-filters">
          {view !== "summary" && (
            <label className="cm-search">
              <Search size={16} />
              <input
                aria-label="Search team progress"
                placeholder={
                  view === "detail"
                    ? "Search competency or skill…"
                    : "Search name, email or skill…"
                }
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
              />
            </label>
          )}
          <select
            aria-label="Filter competency"
            value={competency}
            onChange={(e) => {
              setCompetency(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All competencies</option>
            {data.competencies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {view !== "summary" && (
            <>
              <select
                aria-label="Filter progress status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">All progress statuses</option>
                {["Completed", "In Progress", "Yet to Start"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </>
          )}
          {(query || competency || status) && (
            <button
              className="cm-text-button"
              onClick={() => {
                setQuery("");
                setCompetency("");
                setStatus("");
                setPage(0);
              }}
            >
              Clear filters
            </button>
          )}
        </div>
        {view !== "summary" && (
          <div className="cm-table-controls">
            <ManagerPageSize
              value={entries}
              onChange={(value) => {
                setEntries(value);
                setPage(0);
              }}
            />
            <p className="cm-manager-caption">
              {rows.length} matching skill records
              {view !== "detail"
                ? ` across ${visibleGroups.length} reportees`
                : ""}
              . Exports include all matching rows, across every page.
            </p>
          </div>
        )}
        <div
          className="cm-table-wrap"
          tabIndex={0}
          role="region"
          aria-label={
            view === "detail"
              ? "Detailed skill progress table"
              : "Team progress table"
          }
        >
          <table className="cm-manager-table">
            <thead>
              <tr>
                {(view === "detail"
                  ? [
                      "Skill",
                      "Current level",
                      "Expected level",
                      "Gap",
                      "Progress",
                      "Assigned date",
                      "Completed date",
                      "Action",
                    ]
                  : [
                      "Reportee",
                      "Email ID",
                      "Assigned skills",
                      "Completed",
                      "In progress",
                      "Yet to start",
                      "Completion %",
                      "Action",
                    ]
                ).map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view === "detail"
                ? rows
                    .slice(currentPage * pageSize, (currentPage + 1) * pageSize)
                    .map((a) => {
                      const gap = skillGap(data, a);
                      return (
                        <tr key={a.id}>
                          <td>
                            <strong>
                              {skill(a)?.name || "Unavailable skill"}
                            </strong>
                            <small>{competencyName(a)}</small>
                          </td>
                          <td>{levelName(data, a.current)}</td>
                          <td>{levelName(data, a.expected)}</td>
                          <td>
                            <strong className={gap ? "cm-manager-gap" : ""}>
                              {gap ?? "Not assessed"}
                            </strong>
                            <small>
                              {gap === null
                                ? "Record current level"
                                : `${gap === 1 ? "level" : "levels"} to target`}
                            </small>
                          </td>
                          <td>
                            <StatusBadge status={progress(data, a)} />
                          </td>
                          <td>{formatDate(a.assignedDate)}</td>
                          <td>{formatDate(a.completedDate)}</td>
                          <td>
                            <button
                              className="cm-button"
                              aria-label={`Update level for ${skill(a)?.name}`}
                              onClick={() => setEditing(a.id)}
                            >
                              Update level
                            </button>
                          </td>
                        </tr>
                      );
                    })
                : visibleGroups
                    .slice(currentPage * pageSize, (currentPage + 1) * pageSize)
                    .map(([id, items]) => {
                      const done = items.filter(
                          (a) => progress(data, a) === "Completed",
                        ).length,
                        inProgress = items.filter(
                          (a) => progress(data, a) === "In Progress",
                        ).length,
                        completion = Math.round((done / items.length) * 100);
                      return (
                        <tr key={id}>
                          <td>
                            <strong>{items[0].name}</strong>
                            <small>{items[0].department}</small>
                          </td>
                          <td>
                            {employeeFor(work, items[0])?.email ||
                              "Not recorded"}
                          </td>
                          <td>{items.length}</td>
                          <td>{done}</td>
                          <td>{inProgress}</td>
                          <td>{items.length - done - inProgress}</td>
                          <td>
                            <div className="cm-manager-completion">
                              <strong>{completion}%</strong>
                              <progress
                                aria-label={`${items[0].name} completion`}
                                max={100}
                                value={completion}
                              />
                            </div>
                          </td>
                          <td>
                            <button
                              className="cm-button"
                              aria-label={`View skills for ${items[0].name}`}
                              onClick={() => go("detail", id)}
                            >
                              View skills <ArrowRight size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
              {!total && (
                <tr>
                  <td colSpan={8}>
                    <div className="cm-manager-empty">
                      <Users size={28} />
                      <strong>
                        {data.assignments.length
                          ? "No matching records"
                          : "No team assignments yet"}
                      </strong>
                      <p>
                        {data.assignments.length
                          ? "Try a different search or clear the filters."
                          : "Assigned skills will appear here when employees are enrolled."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {view === "summary" ? (
          <p className="cm-manager-caption">
            Showing {Math.min(total, 5)} of {total} reportees. Counts reflect
            the selected competency.
          </p>
        ) : (
          <ManagerPagination
            total={total}
            page={currentPage}
            pageSize={pageSize}
            onPage={setPage}
          />
        )}
      </section>
      {editing && (
        <ManagerSkillDialog
          key={editing}
          data={data}
          work={work}
          save={save}
          assignmentId={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`cm-manager-status ${status === "Completed" || status === "Approved" ? "success" : status === "Rejected" ? "rejected" : status === "In Progress" || status === "Under Review" ? "pending" : ""}`}
    >
      {status}
    </span>
  );
}
export function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}
