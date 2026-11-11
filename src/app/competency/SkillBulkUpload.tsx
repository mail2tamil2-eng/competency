import { useState, useRef } from "react";
import { Data, download } from "./model";
import { Course } from "./workflowModel";
import { count, UploadSteps, UploadDropZone, FileColumnsGuide, UploadSummary } from "./BulkUploadParts";
import { SkillImport, prepareSkillImport, skillTemplate, courseList } from "./skillImport";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";

const FIELDS: [string, "Required" | "Optional" | "Auto"][] = [
  ["Skill Name", "Required"],
  ["Skill Description", "Optional"],
  ["Level Name", "Auto"],
  ["Level Description", "Optional"],
  ["Course ID", "Optional"],
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
  // Count only skills whose rows are all error-free.
  const badNames = new Set(errors.map((r) => r.skill.toLowerCase()));
  const readySkills = preview?.skills.filter((sk) => !badNames.has(sk.name.toLowerCase())).length ?? 0;

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
        <UploadSteps reviewed={!!preview} />
        <UploadDropZone fileName={fileName} limits="CSV · Up to 5,000 Rows · 2 MB" label="Skill CSV File" onFile={(f) => void load(f)} />
        <FileColumnsGuide
          columns={FIELDS.map(([name, note]) => ({ name, required: note === "Required", auto: note === "Auto" }))}
          links={[
            { label: "Download Template", onClick: () => download("skill-master-template.csv", skillTemplate(data)) },
            { label: "Course IDs", onClick: () => download("course-ids.csv", courseList(courses)) },
          ]}
          hint="Level names are pre-filled in the template. Use Course ID only to map courses; separate several with a semicolon (c1;c2)."
        />
        {error && <p role="alert" className="cm-error">{error}</p>}
        {busy && <p role="status">Checking your file…</p>}
        {preview && (
          <>
            <UploadSummary
              items={[count(readySkills, "New Skill"), count(preview.mappings.length, "Course Mapping")]}
              attention={errors.length}
              issues={errors.map((r) => `Row ${r.line}${r.skill ? ` (${r.skill})` : ""}: ${r.errors.join(" ")}`)}
              onDownloadErrors={() =>
                download("skill-import-errors.csv", [
                  ["Row", "Skill Name", "Level Name", "Errors"],
                  ...errors.map((r) => [String(r.line), r.skill, r.level, r.errors.join(" ")]),
                ])
              }
            />
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
