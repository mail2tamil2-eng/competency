# Competency project handover

React 18 + TypeScript + Vite interactive LMS competency prototype. The user is iterating on administrator, reporting manager and learner designs. Keep explanations plain and short.

## Setup

- Install dependencies: `npm ci`
- Preview: `npm run dev -- --host 127.0.0.1 --port 5190`
- Verify: `npm run typecheck` and `npm run build`
- Browser tests with preview running: `npm run test:e2e`
- Playwright uses installed Google Chrome; see `playwright.config.ts`.
- Live site: https://competency-management.vercel.app
- Repository: https://github.com/mail2tamil2-eng/competency
- Vercel project: `competency-management`. Link a new checkout using your own authenticated account; credentials and `.vercel` are excluded.

## Current behavior and preferences

- Font: bundled Nunito Sans. Brand accent #2D74FA; readable action blue #2463D6. Supporting text minimum 14px, table values 15px, body/forms 16px. Preserve readable disabled/hover states.
- Administrator opens on Competency framework; Overview was removed. Framework intro example and total-count banner were also removed.
- Exactly two admin reports: Skill-wise learner progress and Learner-wise skill report. Learner columns: ID, name, email, role, department, reporting manager, skill, current/expected levels, gap, assigned/completed dates. CSV exports all filtered rows.
- Assignment setup has numbered sections, enrolment explanations, optional end-date checkbox and Cohort replacing Location in the UI.
- Manual enrolment uses Static; Dynamic is disabled. User selection has ID/name/email search, department/role/cohort filters, pagination, selected-only view, select-page/all-matching and persistent selection. Tested with 1,005 employees.
- Manager overview, all reportees, reportee skills and proof submissions are separate views. All-reportees and individual-skill views hide the top Team progress menu and overview/proof tabs. Back buttons are at the top.
- Manager preview hides the top Team progress tab everywhere. Team Skill Progress has no summary statistic cards or filters; Team overview/Proof submissions navigation remains. All-reportees, individual-skill and proof views retain their own filters.
- Manager level updates allow only higher active levels. Lower/equal options remain visible as Completed but disabled. Optional remarks and history are available. Assigned/completed dates appear in the skill table.
- Learner preview has My learning and Skill progress report tabs. The report route is `/competency-management/learner/report`, with assigned skill, current/expected levels, numeric gap (Not assessed when unknown), assigned/completed dates and status. Selection is shared across both learner tabs and grouped by employee identity. Report supports search, status filtering and pagination.
- Proof review supports approve/reject with rejection feedback. Manager detailed reports export CSV and XLSX.

## Code map

- `src/app/pages/CompetencyManagementPage.tsx`: entry point, navigation and persistence.
- `src/app/competency/model.ts`: core data and demo records.
- `workflowModel.ts`: employees, plans, course progression and schedule reconciliation.
- `Workflows.tsx`: role/course mapping and learner course/proof UI.
- `AssignmentConfiguration.tsx`, `AssignmentSkills.tsx`, `ManualAudience.tsx`: assignment setup.
- `AdminReports.tsx`: administrator reports.
- `ManagerProgress.tsx`, `ManagerProofs.tsx`, `ManagerReview.tsx`, `managerModel.ts`: manager screens and rules.
- `competency.css`, `design-system.css`, `manager.css`, `platform-theme.css`: layered styling; check selector precedence.
- Tests: `tests/competency.spec.ts`, `tests/manager.spec.ts`, `tests/admin-updates.spec.ts`.

## Boundaries and continuation

Data is browser-local under `axle-competency-v1`. Cloning does not transfer browser records or uploaded proofs. Initial records are demo data. Role previews are not production authorization, course completion is simulated, and dynamic/scheduled plans reconcile when the workspace opens. No production database, HR/LMS integration or background enrolment job exists.

Verify screens/code before treating previous conversational user-flow descriptions as implemented features. `ADMIN_ASSIGNMENT_REPORTS.md` and `DESIGN_READABILITY_REVIEW.md` document recent work. Older handovers/screenshots may show superseded designs. This file describes intended behavior as of 24 September 2026.
