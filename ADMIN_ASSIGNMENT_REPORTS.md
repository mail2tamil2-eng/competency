# Admin reports and assignment setup

- Admin reports now contain only Skill-wise learner progress and Learner-wise skill report. The latter includes user ID, learner name, email, role, department, reporting manager, skill, current/expected levels, numeric skill gap, assigned date and completed date. Missing profile/date values are shown as Not recorded, and an unassessed skill has no invented numeric gap.
- Reports support search, skill drill-down, pagination and CSV export of all matching records.
- Assignment setup has numbered sections, enrolment help, fixed footer actions and an independently scrolling body.
- Manual enrolment supports name/email/ID search, department/role/cohort filters, selected-only view, page selection, explicit all-matching selection and clearing. Selections persist across filters/pages. Manual enrolment uses Static; Dynamic is disabled because the audience is explicitly selected.
- Location was replaced by Cohort in the configuration UI. Employee.cohort and Plan.cohort are optional fields. Cohort options come from available employee profiles; existing profiles without cohort data remain usable.
- End date is optional. An enabled end date must be populated and on/after the start. Plans without end dates continue to apply while active.
- Static assignments snapshot employee IDs so people sharing names remain distinct. Legacy assignments retain their existing name-based fallback.
- The app continues to use its existing browser-local data store. Tests seed 1,005 employees; this demonstrates UI selection, not a production HR-directory integration. Automatic plans run when this workspace is loaded.

Validation: typecheck/build passed, 18 existing admin tests and 4 new report/selection/model tests passed. Desktop/mobile screenshots reviewed. New coverage checks 1,005-user selection, filter persistence, CSV columns, cohort matching, open-ended plans and duplicate-name identities.
