# Design readability review — 23 September 2026

## Findings and changes
- Supporting labels, metadata, table headers and statuses previously used 10–13px type. Competency styles now have a 14px minimum; body and form controls use 16px, table values 15px, headings 20/24/28px (smaller page headings on mobile).
- Nunito Sans remains the bundled font. Supporting text uses #526176 (6.31:1 on white); main text #111827 (17.74:1 on white).
- Brand #2D74FA remains for accents, progress indicators and focus. White against this blue is 4.21:1, so normal-size text links and filled primary actions use #2463D6 (5.48:1 against white). These choices target WCAG 2.2 normal-text contrast of 4.5:1: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- Primary save/create actions are filled blue; secondary navigation/export/cancel actions are outlined; destructive actions red. Disabled actions retain readable text and distinct backgrounds.
- Shared buttons and fields use 44px minimum height, 16px text, stronger borders, readable placeholders and visible focus indicators. Icon-only competency controls have 44px targets.
- Green/yellow status badges retain text labels and darker foregrounds.

## Verification
- Production build passed; 25 existing workflow tests passed, including mobile layouts, dialogs, pagination, proof review, proficiency updates and exports.
- Browser screenshots reviewed for manager reportees, overview, and update-level dialog at desktop and 390px mobile width.
- Computed text-size sampling found no visible text below 14px on overview, framework, settings, reportees, reportee skills and update-level dialog.
- Solid-background text contrast sampled on overview, reportees and update dialog; low-contrast overview labels corrected. This targeted review is not a full accessibility certification; uploaded evidence and every possible data/state combination were not audited.
