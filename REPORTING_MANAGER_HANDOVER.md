# Reporting Manager: Team Skill Progress

## Outcome

Managers can understand team progress, assess a reportee’s current proficiency, review submitted evidence, and download detailed reports. Implemented in the existing **Manager preview** workspace.

## Screen flow

Manager screens now have independent URLs, support direct opening and refresh, and work with browser Back/Forward:

- Overview: `/competency-management/manager`
- View all reportees: `/competency-management/manager/reportees`
- Reportee detail: `/competency-management/manager/reportee?person=...`
- Proof submissions: `/competency-management/manager/proofs`

The dedicated Proof submissions page is always accessible from the manager overview, including when empty. It lists reportee, course, mapped skill, skill level, proof filename, submission date, status, and a Review proof / View decision action. Search and status filters help managers locate submissions; Review pending proofs opens this page filtered to Under Review.

1. **Team overview:** summary cards and a compact Team Skill Progress table. A competency filter narrows the table. View all opens the full reportee table. Review pending proofs opens the full table filtered to assignments needing review.
2. **All reportees:** searchable, paginated table with reportee name, email, assigned skills, completed, in progress, yet to start, and completion percentage. Filters cover competency, progress, and proof status. Counts reflect matching skill records; cards describe overall scope.
3. **Detailed View:** Assigned skills opens one reportee’s page with name and email, competency, linked skill, numeric gap, linked proof status, progress status, assignment date, and completion date. Breadcrumbs and Back to all reportees provide clear navigation.
4. **Update current level:** the skill link opens a compact dialog matching the supplied reference: learner, competency, skill, current → expected, a higher-level dropdown, and Cancel/Save. Cancel makes no changes. Save changes one assignment and appends a timestamped manual-assessment history entry without requiring extra form fields.
5. **Review proof submissions:** a proof status opens course name, mapped skill, skill level, evidence preview/download, and status. Multiple course submissions use a selector. Managers approve or reject with required rejection feedback. Previous submission outcomes remain visible.

## Business rules

| Item | Implemented rule |
| --- | --- |
| Skill gap | Maximum of expected rank minus current rank and zero. The order in Library settings defines rank. Missing current level displays Not assessed, not a fabricated gap. |
| Completed | Current proficiency meets or exceeds the expected level. |
| In progress | A current level is recorded and is below the expected level. |
| Yet to start | No current proficiency is recorded, consistent with the existing application. This does not independently measure course activity. |
| Completion percentage | Completed skill assignments divided by assigned skill assignments, rounded to a whole percentage. Team completion is weighted by assignments. |
| Manual assessment | Requires a higher active level. Equal or lower levels are rejected. At the highest level, further updates are disabled. Records a manual-assessment audit entry without falsely marking courses completed. |
| Approval | Assumes evidence validates the submitted course’s mapped level. Marks that course completed and raises current proficiency to the mapped level only if higher. Does not complete unrelated courses. The dialog explains this effect before approval. |
| Rejection | Requires feedback. Leaves proficiency and course completion unchanged. Learners use the existing resubmission flow. |
| Proof summary | Latest submission per course: any pending review takes priority, then rejection, then approval. No proof means No submission. |
| Review history | Retains submission outcomes, feedback, reviewer role, review timestamp, and manual/proof-related level changes in browser data. |
| Dates | New assignments record assigned date. Transitions to target record completion date; falling below target clears it. Historical missing dates show a dash. |
| Downloads | CSV and real XLSX contain all matching detailed skill records across pagination. Includes reportee/email, department, competency, skill, current/expected levels, numeric gap, proof status, progress, and dates. XLSX has a frozen header and filters. |

## Feasibility and production requirements

The requested interaction is feasible and works in this frontend prototype. Data currently persists in localStorage in one browser; the preview switch is not authentication. Existing demo employees are visible, and sample email addresses use example.com. The repository does not provide an authenticated reporting hierarchy or shared backend.

Before production:

- Connect the signed-in manager to employee IDs and authoritative reporting relationships. Enforce scope on every list, level update, proof review, evidence download, and export endpoint. Do not rely on client filters for authorization.
- Replace browser storage with shared assignment, evidence, and audit records. Use server timestamps and optimistic concurrency so two managers cannot overwrite reviews.
- Store evidence in managed file storage with authorized download links; validate file contents and size server-side. The existing prototype upload limit is 1 MB per PDF/PNG/JPEG.
- Backfill employee IDs, real emails, and historical dates from the system of record where available. Legacy names are only matched when name and department identify one employee.
- Store the course/skill/level mapping at submission time, and agree how later mapping changes and reassignment affect historical evidence.
- Use the authenticated manager identity in audit history. Current history identifies the Manager role only.

BA decision to validate: approval currently updates the mapped proficiency level directly, even if earlier courses have not been completed. If evidence should only validate course completion, change that policy before rollout. Also confirm whether Yet to start should mean no assessment (current behavior) or no learning activity; these require different data.

## Verification

Back buttons appear at the top of All reportees, Assigned skills, and Proof submissions, above their tables.

View all and Assigned skills are focused table pages: the overview introduction, reportee banner, and four summary cards are omitted. Tables show 10 records per page with Previous/Next, row counts, and page numbers. Search and filters apply across the full dataset, and exports include every matching page. Verified pagination with 14 reportees and 14 assigned skills, plus higher-level-only selection and model validation.

Automated manager coverage includes navigation/search, numeric and unassessed gaps, responsive layout, cancel/save with reason, persisted audit and dates, approval, rejection feedback, protection against repeat review/downgrade on approval, and downloaded CSV/XLSX contents. Existing learner rejection/resubmission/approval coverage follows the updated manager navigation.

Excel export implementation reference: [ExcelJS](https://github.com/exceljs/exceljs).
