import { Upload, Download } from "lucide-react";

/* Shared building blocks so every bulk upload dialog has the same layout:
   steps → upload box → file columns guide → results summary → preview → actions. */

/** "1 Skill", "3 Skills" */
export const count = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;

export function UploadSteps({ reviewed }: { reviewed: boolean }) {
  return (
    <div className="cm-steps">
      <span className="active">1 · Prepare File</span>
      <span className={reviewed ? "active" : ""}>2 · Review</span>
      <span>3 · Import</span>
    </div>
  );
}

export function UploadDropZone({
  fileName,
  limits,
  label = "CSV File",
  disabled,
  onFile,
}: {
  fileName: string;
  limits: string;
  label?: string;
  disabled?: boolean;
  onFile: (file?: File) => void;
}) {
  return (
    <label
      className="cm-drop cm-drop-compact"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}
    >
      <Upload size={22} />
      <span className="cm-drop-text">
        <strong>{fileName || "Choose a CSV file or drop it here"}</strong>
        <span>{limits}</span>
      </span>
      <input aria-label={label} type="file" accept=".csv,text/csv" disabled={disabled} onChange={(e) => onFile(e.target.files?.[0])} />
    </label>
  );
}

export type GuideColumn = { name: string; required?: boolean; auto?: boolean };

export function FileColumnsGuide({
  columns,
  links,
  hint,
}: {
  columns: GuideColumn[];
  links: { label: string; onClick: () => void }[];
  hint: string;
}) {
  return (
    <div className="cm-upload-guide">
      <div className="cm-upload-guide-head">
        <strong>File Columns</strong>
        <div className="cm-upload-guide-links">
          {links.map((l) => (
            <button key={l.label} type="button" className="cm-text-button" onClick={l.onClick}>
              <Download size={15} /> {l.label}
            </button>
          ))}
        </div>
      </div>
      <ul className="cm-column-chips" aria-label="File columns">
        {columns.map((c) => (
          <li key={c.name} className={c.required ? "required" : ""}>
            {c.name}
            {c.required && <span aria-label="required"> *</span>}
            {c.auto && <em> · auto</em>}
          </li>
        ))}
      </ul>
      <p className="cm-upload-hint">
        {columns.some((c) => c.required) && <><span className="cm-req-mark">*</span> Required. </>}
        {hint}
      </p>
    </div>
  );
}

export function UploadSummary({
  items,
  attention,
  issues = [],
  onDownloadErrors,
}: {
  items: string[];
  attention: number;
  /** One line per problem row, e.g. "Row 3: Level Name is missing." Only the first few are shown. */
  issues?: string[];
  onDownloadErrors: () => void;
}) {
  const shown = issues.slice(0, 3);
  return (
    <>
      <div className="cm-import-summary">
        {items.map((t) => <strong key={t}>{t}</strong>)}
        <span>{attention} {attention === 1 ? "Row Needs" : "Rows Need"} Attention</span>
      </div>
      {attention > 0 && (
        <div className="cm-error" role="alert">
          <p className="cm-upload-errors-title">Fix these rows and upload again. Nothing has been saved.</p>
          {shown.length > 0 && (
            <ul className="cm-upload-errors">
              {shown.map((t) => <li key={t}>{t}</li>)}
            </ul>
          )}
          {issues.length > shown.length && <p className="cm-upload-errors-more">and {issues.length - shown.length} more.</p>}
          <button className="cm-text-button" onClick={onDownloadErrors}>Download Errors</button>
        </div>
      )}
    </>
  );
}
