# Competency Management prototype

Interactive React prototype based on the supplied Figma Make export, BRD and HTML wireframe.

Original Figma reference: https://www.figma.com/design/joXnPlm98oAav1ywpqgdSv/Competency

## Run

```powershell
npm install
npm run dev -- --host 127.0.0.1 --port 5190
```

Open http://127.0.0.1:5190.

## One library for competencies and skills

Open **Competencies & Skills**. Each competency expands to show its skills. Skills have proficiency descriptions, courses, and learner progress. Existing record IDs and mappings are preserved.

- **Create competency** guides you through competency details, adding skills, then proficiency descriptions. Everything saves together. You can also save an empty competency as a draft and activate it later.
- **Add skill** inside a competency automatically links the category and parent. Edit and delete actions remain beside each item; items in use are protected.
- **Search** finds competency names, skill names and descriptions and reveals matching skills inside their parent. Header search works across the library.
- **Library settings** contains categories and proficiency levels.

## Combined bulk upload

Use **Bulk upload** in the library to download the combined CSV template.

Columns: Competency, Competency Description, Category, Skill, Skill Description, followed by a description column for each active proficiency level.

- Use one row per skill. Repeat the competency name and category to group multiple skills.
- Categories must already exist and be active.
- New competencies are created automatically. Existing active competencies are reused without changing their IDs.
- Leave the competency description blank when reusing an existing competency to keep its description.
- Leave Skill blank to create an empty competency.
- New skills require a description for every active proficiency level.
- Duplicate skills, category conflicts, missing values, and inconsistent descriptions block the entire import. Existing skills are edited in the library, not overwritten by import.
- Review the new competency/skill counts and row results before saving. Error CSV download is available.
- CSV only, maximum 1,000 rows and 2 MB. New imported records are Active.

## Other workflows

Progress supports individual and bulk current-level updates. Course mapping connects multiple skills to courses. Role mapping provides manual/automatic enrolment, static/dynamic audiences, dates and an assignment preview. Learner preview shows sequential learning plans and proof submission. Manager preview supports proficiency updates and proof reviews. Reports include competency totals, skill-wise proficiency, learner drilldown and CSV downloads.

Changes are saved in this browser under the existing versioned key `axle-competency-v1`. Initial records are demo data. Other tabs and browsers do not synchronize.

## Verification

Start the local preview on port 5190, then run:

```powershell
npm run typecheck
npm run build
npm run test:e2e
```

Tests use installed Google Chrome and cover combined creation, inherited skill links, grouped imports, invalid imports, search, drafts, persistence, protected deletion, role assignment, learning progression, proof review, reports, bulk progress and mobile layout.

## Prototype boundaries

This is a local interactive design prototype, not a production LMS backend. Employee data is seeded; role previews are not authorization. Course completion is simulated. Dynamic/scheduled assignments reconcile when the workspace opens rather than through a server job. Certificates are stored locally (PDF/PNG/JPEG, 1 MB each), subject to browser storage limits.

Remaining production and BRD work includes authenticated role access, employee/cohort integration, LMS delivery, server-side enrolment and notifications, durable file/database storage, module access configuration, audit history and XLSX export. ILT remains out of scope as specified in the BRD.

Screenshots are in `artifacts/`.
