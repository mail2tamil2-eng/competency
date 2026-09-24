import { useState } from "react";
import { useSearchParams } from "react-router";
import { ClipboardCheck, Search } from "lucide-react";
import { ManagerNavigation } from "./ManagerNavigation";
import { ManagerPagination, ManagerPageSize } from "./ManagerPagination";
import type { ManagerProps } from "./ManagerProgress";
import { ManagerProofDialog } from "./ManagerReview";
import { employeeFor, latestProofs, levelName } from "./managerModel";

export function ManagerProofs({ data, work, save }: ManagerProps) {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") || "";
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [entries, setEntries] = useState(10);
  const [selected, setSelected] = useState<string | null>(null);
  const submissions = data.assignments.flatMap((a) =>
    latestProofs(work, a.id).map((proof) => ({
      a,
      proof,
      course: work.courses.find((c) => c.id === proof.courseId),
      skill: data.skills.find((s) => s.id === a.skillId),
    })),
  );
  const rows = submissions.filter(
    ({ a, proof, course, skill }) =>
      (!status || proof.status === status) &&
      `${a.name} ${employeeFor(work, a)?.email || ""} ${course?.name} ${skill?.name}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(rows.length / entries) - 1),
  );
  const chosen = submissions.find((x) => x.proof.id === selected);
  return (
    <div className="cm-manager">
      <ManagerNavigation />
      <div className="cm-manager-stats">
        {["All submissions", "Under Review", "Approved", "Rejected"].map(
          (label) => (
            <article key={label}>
              <div>
                <span>{label}</span>
                <ClipboardCheck size={18} />
              </div>
              <strong>
                {label === "All submissions"
                  ? submissions.length
                  : submissions.filter((x) => x.proof.status === label).length}
              </strong>
              <small>
                {label === "Under Review"
                  ? "Awaiting your decision"
                  : "Latest submission per course"}
              </small>
            </article>
          ),
        )}
      </div>
      <section className="cm-card">
        <div className="cm-section-head">
          <div>
            <h3>Submitted evidence</h3>
            <p>
              Open a submission to see its proof, mapped skill level, and review
              actions.
            </p>
          </div>
        </div>
        <div className="cm-manager-filters">
          <label className="cm-search">
            <Search size={16} />
            <input
              aria-label="Search proof submissions"
              placeholder="Search reportee, course or skill…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
            />
          </label>
          <select
            aria-label="Filter proof status"
            value={status}
            onChange={(e) => {
              setParams(e.target.value ? { status: e.target.value } : {});
              setPage(0);
            }}
          >
            <option value="">All proof statuses</option>
            {["Under Review", "Approved", "Rejected"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          {(query || status) && (
            <button
              className="cm-text-button"
              onClick={() => {
                setQuery("");
                setParams({});
                setPage(0);
              }}
            >
              Clear filters
            </button>
          )}
        </div>
        <div className="cm-table-controls">
          <ManagerPageSize
            value={entries}
            onChange={(value) => {
              setEntries(value);
              setPage(0);
            }}
          />
        </div>
        <div
          className="cm-table-wrap"
          role="region"
          aria-label="Proof submissions table"
          tabIndex={0}
        >
          <table className="cm-manager-table">
            <thead>
              <tr>
                {[
                  "Reportee",
                  "Course name",
                  "Mapped skill",
                  "Skill level",
                  "Proof",
                  "Submitted date",
                  "Status",
                  "Action",
                ].map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows
                .slice(currentPage * entries, (currentPage + 1) * entries)
                .map(({ a, proof, course, skill }) => (
                  <tr key={proof.id}>
                    <td>
                      <strong>{a.name}</strong>
                      <small>
                        {employeeFor(work, a)?.email || "Email not recorded"}
                      </small>
                    </td>
                    <td>{course?.name || "Unavailable course"}</td>
                    <td>{skill?.name || "Unavailable skill"}</td>
                    <td>
                      {levelName(
                        data,
                        proof.levelId ||
                          course?.mappings.find((m) => m.skillId === a.skillId)
                            ?.levelId ||
                          "",
                      )}
                    </td>
                    <td>
                      <button
                        className="cm-manager-link"
                        onClick={() => setSelected(proof.id)}
                      >
                        {proof.fileName}
                      </button>
                    </td>
                    <td>{proof.submitted}</td>
                    <td>
                      <span
                        className={`cm-manager-status ${proof.status === "Approved" ? "success" : proof.status === "Rejected" ? "rejected" : "pending"}`}
                      >
                        {proof.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="cm-button"
                        aria-label={`${proof.status === "Under Review" ? "Review" : "View"} proof for ${a.name} ${course?.name || "course"}`}
                        onClick={() => setSelected(proof.id)}
                      >
                        {proof.status === "Under Review"
                          ? "Review proof"
                          : "View decision"}
                      </button>
                    </td>
                  </tr>
                ))}
              {!rows.length && (
                <tr>
                  <td colSpan={8}>
                    <div className="cm-manager-empty">
                      <ClipboardCheck size={32} />
                      <strong>
                        {submissions.length
                          ? "No matching submissions"
                          : "No proof submissions yet"}
                      </strong>
                      <p>
                        {submissions.length
                          ? "Try another search or clear the status filter."
                          : "When a reportee submits a certificate or supporting document from My learning, it will appear here for review."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <ManagerPagination
          total={rows.length}
          page={currentPage}
          pageSize={entries}
          onPage={setPage}
        />
      </section>
      {chosen && (
        <ManagerProofDialog
          key={chosen.proof.id}
          data={data}
          work={work}
          save={save}
          assignmentId={chosen.a.id}
          initialProofId={chosen.proof.id}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
