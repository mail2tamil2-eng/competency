import { useState, useRef } from "react";
import { Upload, Download } from "lucide-react";
import { Data, download } from "./model";
import { Course } from "./workflowModel";
import { SkillImport, prepareSkillImport, skillTemplate, courseList } from "./skillImport";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";

const FIELDS: [string, string][] = [
  ["Skill Name", "Required"],
  ["Skill Description", "Optional"],
  ["Level Name", "System generated"],
  ["Level Description", "Required"],
  ["Course ID", "Optional · only when mapping courses"],
];

export function SkillBulkUpload({
  data,
  courses,
  onClose,
  onImport,
}: {
  data: Data;
  courses: Course[];
  onClose: () => void;
  onImport: (result: SkillImport) => void;
}) {
  const [preview, setPreview] = useState<SkillImport | null>(null),
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
      setError("Choose a CSV file. Download the template below to get started.");
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
      setPreview(prepareSkillImport(text, data, courses));
    } catch (e) {
      if (current === request.current) setError(e instanceof Error ? e.message : "Unable to read this file.");
    } finally {
      if (current === request.current) setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="cm-dialog cm-wide">
        <DialogHeader>
          <DialogTitle>Bulk Upload Skills</DialogTitle>
          <DialogDescription>
            Add many skills at once. Use one row for each skill and proficiency level.
          </DialogDescription>
        </DialogHeader>
        <div className="cm-steps">
          <span className="active">1 · Prepare File</span>
          <span className={preview ? "active" : ""}>2 · Review</span>
          <span>3 · Import</span>
        </div>
        <div className="cm-template">
          <div>
            <strong>Download the Template</strong>
            <p>Level names are already filled in for your active proficiency levels. Copy the rows for each new skill.</p>
          </div>
          <button className="cm-button" onClick={() => download("skill-master-template.csv", skillTemplate(data))}>
            <Download size={16} /> Download Template
          </button>
        </div>
        <div className="cm-table-wrap cm-skill-upload-fields">
          <table>
            <thead>
              <tr><th>Field</th><th>Mandatory</th></tr>
            </thead>
            <tbody>
              {FIELDS.map(([f, m]) => (
                <tr key={f}><td><strong>{f}</strong></td><td>{m}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="cm-upload-hint">
          To map more than one course to a level, separate Course IDs with a semicolon (c1;c2).{" "}
          <button type="button" className="cm-text-button" onClick={() => download("course-ids.csv", courseList(courses))}>
            Download Course IDs
          </button>
        </p>
        <label
          className="cm-drop"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); void load(e.dataTransfer.files[0]); }}
        >
          <Upload size={25} />
          <strong>{fileName || "Choose a CSV file or drop it here"}</strong>
          <span>CSV · Up to 5,000 Rows · 2 MB</span>
          <input aria-label="Skill CSV File" type="file" accept=".csv,text/csv" onChange={(e) => void load(e.target.files?.[0])} />
        </label>
        {error && <p role="alert" className="cm-error">{error}</p>}
        {busy && <p role="status">Checking your file…</p>}
        {preview && (
          <>
            <div className="cm-import-summary">
              <strong>{preview.skills.length} New Skills</strong>
              <strong>{preview.mappings.length} Course Mappings</strong>
              <span>{errors.length} Rows Need Attention</span>
            </div>
            {errors.length > 0 && (
              <div className="cm-error" role="alert">
                Fix the listed errors and upload again. Nothing has been saved.{" "}
                <button
                  className="cm-text-button"
                  onClick={() =>
                    download("skill-import-errors.csv", [
                      ["Row", "Skill Name", "Level Name", "Errors"],
                      ...errors.map((r) => [String(r.line), r.skill, r.level, r.errors.join(" ")]),
                    ])
                  }
                >
                  Download Errors
                </button>
              </div>
            )}
            <div className="cm-table-wrap cm-preview">
              <table>
                <thead>
                  <tr><th>Row</th><th>Skill</th><th>Level</th><th>Courses</th><th>Result</th></tr>
                </thead>
                <tbody>
                  {preview.rows.map((r) => (
                    <tr key={r.line}>
                      <td>{r.line}</td>
                      <td>{r.skill || "Missing name"}</td>
                      <td>{r.level || "—"}</td>
                      <td>{r.courses.join(", ") || "—"}</td>
                      <td className={r.errors.length ? "cm-invalid" : ""}>{r.errors.join(" ") || "Ready"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <div className="cm-dialog-actions">
          <button className="cm-button" onClick={onClose}>Cancel</button>
          <button
            className="cm-button primary"
            disabled={busy || !preview || errors.length > 0 || !preview.skills.length}
            onClick={() => preview && onImport(preview)}
          >
            Import Skills
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
