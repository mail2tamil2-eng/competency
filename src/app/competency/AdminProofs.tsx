import { titleCaseLabel } from "./displayText";
import { statusText } from "./displayText";
import { useState } from "react";
import { ClipboardCheck, Search } from "lucide-react";
import { ManagerPagination, ManagerPageSize } from "./ManagerPagination";
import type { ManagerProps } from "./ManagerProgress";
import { ManagerProofReviewPage } from "./ManagerReview";
import { employeeFor, latestProofs } from "./managerModel";

export function AdminProofs({ data, work, save }: ManagerProps) {
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [entries, setEntries] = useState(10);
  const [selected, setSelected] = useState<string | null>(null);

  const submissions = data.assignments.flatMap((a) =>
    latestProofs(work, a.id).map((proof) => ({
      a,
      proof,
      skill: data.skills.find((s) => s.id === a.skillId),
    })),
  );

  const rows = submissions.filter(
    ({ a, proof, skill }) =>
      (!status || proof.status === status) &&
      `${a.name} ${employeeFor(work, a)?.email || ""} ${skill?.name}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );

  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(rows.length / entries) - 1),
  );

  const chosen = submissions.find((x) => x.proof.id === selected);
  if (chosen) {
    return (
      <ManagerProofReviewPage
        data={data}
        work={work}
        save={save}
        assignmentId={chosen.a.id}
        proofId={chosen.proof.id}
        onClose={() => setSelected(null)}
      />
    );
  }

  return (
    <div>
      <section className="cm-card">
        <div className="cm-section-head">
          <div>
            <h2>Proof Submissions</h2>
            <p>Open a submission to view the proof and approve or reject it.</p>
          </div>
        </div>

        <div className="cm-report-filters">
          <label className="cm-search" style={{ flex: 1, minWidth: 220 }}>
            <Search size={16} />
            <input
              aria-label="Search Proof Submissions"
              placeholder="Search learner or skill…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            />
          </label>
          <select
            aria-label="Filter Proof Status"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
          >
            <option value="">All Proof Statuses</option>
            {["Under Review", "Approved", "Rejected"].map((s) => (
              <option key={s} value={s}>{statusText(s)}</option>
            ))}
          </select>
          {(query || status) && (
            <button
              className="cm-text-button"
              onClick={() => { setQuery(""); setStatus(""); setPage(0); }}
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="cm-table-wrap" role="region" aria-label="Proof Submissions Table" tabIndex={0}>
          <table className="cm-manager-table">
            <thead>
              <tr>
                {["Learner", "Skill", "Proof File", "Submitted Date", "Status", "Action"].map((h) => (
                  <th key={h} scope="col">{titleCaseLabel(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows
                .slice(currentPage * entries, (currentPage + 1) * entries)
                .map(({ a, proof, skill }) => (
                  <tr key={proof.id}>
                    <td>
                      <strong>{a.name}</strong>
                      <small>{employeeFor(work, a)?.email || "Email not recorded"}</small>
                    </td>
                    <td>{skill?.name || "Unavailable skill"}</td>
                    <td>
                      <button className="cm-manager-link" onClick={() => setSelected(proof.id)}>
                        {proof.fileName}
                      </button>
                    </td>
                    <td>{proof.submitted}</td>
                    <td>
                      <span className={`cm-manager-status ${proof.status === "Approved" ? "success" : proof.status === "Rejected" ? "rejected" : "pending"}`}>
                        {statusText(proof.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="cm-button"
                        aria-label={`${proof.status === "Under Review" ? "Review" : "View"} proof for ${a.name}`}
                        onClick={() => setSelected(proof.id)}
                      >
                        {proof.status === "Under Review" ? "Review Proof" : "View Decision"}
                      </button>
                    </td>
                  </tr>
                ))}
              {!rows.length && (
                <tr>
                  <td colSpan={6}>
                    <div className="cm-manager-empty">
                      <ClipboardCheck size={32} />
                      <strong>
                        {submissions.length ? "No matching submissions" : "No proof submissions yet"}
                      </strong>
                      <p>
                        {submissions.length
                          ? "Try another search or clear the status filter."
                          : "When a learner submits a certificate or supporting document, it will appear here for review."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="cm-table-controls">
          <ManagerPageSize value={entries} onChange={(v) => { setEntries(v); setPage(0); }} />
          <ManagerPagination total={rows.length} page={currentPage} pageSize={entries} onPage={setPage} />
        </div>
      </section>
    </div>
  );
}
