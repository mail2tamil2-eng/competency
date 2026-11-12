import { useState, useRef } from "react";
import { count, UploadDropZone, UploadSummary } from "./BulkUploadParts";
import { Data, download } from "./model";
import {
  LibraryImport,
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
      setError("Choose a CSV file.");
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
          <DialogTitle>Bulk Upload Competencies & Skills</DialogTitle>
          <DialogDescription>
            Add many competencies and skills at once. Use one row for each skill.
          </DialogDescription>
        </DialogHeader>
        <UploadDropZone fileName={fileName} limits="CSV · Up to 1,000 Rows · 2 MB" onFile={(f) => void load(f)} />
        {error && (
          <p role="alert" className="cm-error">
            {error}
          </p>
        )}
        {preview && (
          <>
            <UploadSummary
              items={[count(preview.competencies.length, "New Competency", "New Competencies"), count(preview.skills.length, "New Skill")]}
              attention={errors.length}
              issues={errors.map((r) => `Row ${r.line}${r.competency ? ` (${r.competency})` : ""}: ${r.errors.join(" ")}`)}
              onDownloadErrors={() =>
                download("library-import-errors.csv", [
                  ["Row", "Competency", "Skill", "Errors"],
                  ...errors.map((r) => [String(r.line), r.competency, r.skill, r.errors.join(" ")]),
                ])
              }
            />
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
            Import Competencies
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
