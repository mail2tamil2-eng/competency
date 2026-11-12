import { useRef } from "react";
import { Upload, X } from "lucide-react";

/* Shared building blocks so every bulk upload dialog has the same layout:
   upload box → results summary → actions. */

/** "1 Skill", "3 Skills" */
export const count = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;

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
  /** Called with undefined when the file is removed. */
  onFile: (file?: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="cm-drop-wrap">
      <label
        className={"cm-drop cm-drop-compact" + (fileName ? " has-file" : "")}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}
      >
        <Upload size={22} />
        <span className="cm-drop-text">
          <strong>{fileName || "Choose a CSV file or drop it here"}</strong>
          <span>{fileName ? "Click to choose a different file" : limits}</span>
        </span>
        <input ref={inputRef} aria-label={label} type="file" accept=".csv,text/csv" disabled={disabled} onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      {fileName && (
        <button
          type="button"
          className="cm-drop-remove"
          aria-label={`Remove file ${fileName}`}
          title="Remove file"
          disabled={disabled}
          onClick={() => {
            // Clear the input so the same file can be chosen again.
            if (inputRef.current) inputRef.current.value = "";
            onFile(undefined);
          }}
        >
          <X size={16} /> Remove
        </button>
      )}
    </div>
  );
}

/** "Skill Name, Level Name and Course ID" */
export const listJoin = (xs: string[]) => xs.length < 2 ? xs.join("") : xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1];

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
