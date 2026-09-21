import { useState, useRef } from "react";
import { Upload, Download } from "lucide-react";
import { Data, download } from "./model";
import {
  LibraryImport,
  libraryHeaders,
  prepareLibraryImport,
} from "./libraryImport";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
export function LibraryBulkUpload({
  data,
  onClose,
  onImport,
}: {
  data: Data;
  onClose: () => void;
  onImport: (result: LibraryImport) => void;
}) {
  const [preview, setPreview] = useState<LibraryImport | null>(null),
    [error, setError] = useState(""),
    [fileName, setFileName] = useState(""),
    [busy, setBusy] = useState(false);
  const request = useRef(0);
  const errors = preview?.rows.filter((r) => r.errors.length) || [];
  async function load(file?: File) {
    const current = ++request.current;
    setPreview(null);
    setError("");
    setFileName(file?.name || "");
    setBusy(false);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Choose a CSV file. Use the template below to get started.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Keep your CSV under 2 MB.");
      return;
    }
    setBusy(true);
    try {
      const text = await file.text();
      if (current !== request.current) return;
      setPreview(prepareLibraryImport(text, data));
    } catch (e) {
      if (current === request.current)
        setError(e instanceof Error ? e.message : "Unable to read this file.");
    } finally {
      if (current === request.current) setBusy(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="cm-dialog cm-wide">
        <DialogHeader>
          <DialogTitle>Bulk upload competencies & skills</DialogTitle>
          <DialogDescription>
            One file for your library. Each row adds a skill; repeated
            competency names group the skills automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="cm-steps">
          <span className="active">1 · Prepare file</span>
          <span className={preview ? "active" : ""}>2 · Review</span>
          <span>3 · Import together</span>
        </div>
        <div className="cm-template">
          <div>
            <strong>Use one row per skill</strong>
            <p>
              Use an existing category. You can add skills to existing active
              competencies. Leave Skill blank to create an empty competency.
            </p>
          </div>
          <button
            className="cm-button"
            onClick={() =>
              download("competencies-and-skills-template.csv", [
                libraryHeaders(data),
              ])
            }
          >
            <Download size={16} />
            Download template
          </button>
        </div>
        <div className="cm-import-example">
          <strong>Example</strong>
          <span>Communication → Active Listening</span>
          <span>Communication → Public Speaking</span>
          <small>Creates one competency containing two skills.</small>
        </div>
        <label
          className="cm-drop"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void load(e.dataTransfer.files[0]);
          }}
        >
          <Upload size={25} />
          <strong>{fileName || "Choose a CSV file or drop it here"}</strong>
          <span>CSV · Up to 1,000 rows · 2 MB</span>
          <input
            aria-label="CSV file"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => void load(e.target.files?.[0])}
          />
        </label>
        {error && (
          <p role="alert" className="cm-error">
            {error}
          </p>
        )}
        {busy && <p role="status">Checking your file…</p>}
        {preview && (
          <>
            <div className="cm-import-summary">
              <strong>{preview.competencies.length} new competencies</strong>
              <strong>{preview.skills.length} new skills</strong>
              <span>{errors.length} rows need attention</span>
            </div>
            {errors.length > 0 && (
              <div className="cm-error" role="alert">
                Fix the listed errors and upload again. Nothing has been saved.
                <button
                  className="cm-text-button"
                  onClick={() =>
                    download("library-import-errors.csv", [
                      ["Row", "Competency", "Skill", "Errors"],
                      ...errors.map((r) => [
                        String(r.line),
                        r.competency,
                        r.skill,
                        r.errors.join(" "),
                      ]),
                    ])
                  }
                >
                  Download errors
                </button>
              </div>
            )}
            <div className="cm-table-wrap cm-preview">
              <table>
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Competency</th>
                    <th>Skill</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((r) => (
                    <tr key={r.line}>
                      <td>{r.line}</td>
                      <td>{r.competency || "Missing name"}</td>
                      <td>{r.skill || "No skill yet"}</td>
                      <td className={r.errors.length ? "cm-invalid" : ""}>
                        {r.errors.join(" ") || r.action}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <div className="cm-dialog-actions">
          <button className="cm-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="cm-button primary"
            disabled={busy || !preview || errors.length > 0}
            onClick={() => preview && onImport(preview)}
          >
            Import to library
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
