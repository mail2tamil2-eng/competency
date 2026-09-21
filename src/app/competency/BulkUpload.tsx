import { useState } from "react";
import { Download, Upload, FileCheck2 } from "lucide-react";
import {
  Data,
  Kind,
  RecordItem,
  download,
  parseCSV,
  uid,
  validate,
} from "./model";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
type Row = { line: number; item: RecordItem; errors: string[] };
export function BulkUpload({
  kind,
  data,
  onClose,
  onImport,
}: {
  kind: "skills" | "competencies";
  data: Data;
  onClose: () => void;
  onImport: (items: RecordItem[]) => void;
}) {
  const [rows, setRows] = useState<Row[]>([]),
    [error, setError] = useState(""),
    [fileName, setFileName] = useState(""),
    [busy, setBusy] = useState(false);
  const levels = data.levels.filter((x) => x.status === "Active");
  const headers = [
    "Name",
    "Description",
    "Category",
    ...(kind === "skills"
      ? ["Competency", ...levels.map((x) => x.name + " Description")]
      : []),
    "Status",
  ];
  const invalid = rows.filter((x) => x.errors.length);
  async function load(file?: File) {
    setRows([]);
    setError("");
    setFileName(file?.name || "");
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError(
        "Please upload a CSV file. Download the template to get started.",
      );
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError(
        "Keep the file under 2 MB. Split larger imports into smaller files.",
      );
      return;
    }
    setBusy(true);
    try {
      const parsed = parseCSV(await file.text());
      if (parsed.length < 2)
        throw Error("Add at least one data row below the column headings.");
      if (parsed.length > 1001)
        throw Error("Upload up to 1,000 rows at a time.");
      const cols = parsed[0].map((x) => x.toLowerCase());
      if (new Set(cols).size !== cols.length)
        throw Error("Remove duplicate column headings.");
      const missing = headers.filter((h) => !cols.includes(h.toLowerCase()));
      if (missing.length) throw Error("Missing columns: " + missing.join(", "));
      const seen = new Set<string>();
      setRows(
        parsed.slice(1).map((cells, i) => {
          const get = (name: string) =>
            cells[cols.indexOf(name.toLowerCase())] || "";
          const cat = data.categories.find(
            (x) => x.name.toLowerCase() === get("Category").toLowerCase(),
          );
          const comp = data.competencies.find(
            (x) => x.name.toLowerCase() === get("Competency").toLowerCase(),
          );
          const item: RecordItem = {
            id: uid(),
            name: get("Name"),
            description: get("Description"),
            categoryId: cat?.id,
            competencyId: comp?.id,
            status: (get("Status") || "Active") as RecordItem["status"],
            levels: Object.fromEntries(
              levels.map((x) => [x.id, get(x.name + " Description")]),
            ),
          };
          const errors = validate(item, kind, data);
          if (cells.length !== cols.length)
            errors.push("Column count does not match the header.");
          if (seen.has(item.name.toLowerCase()))
            errors.push("Duplicate name in this file.");
          seen.add(item.name.toLowerCase());
          return { line: i + 2, item, errors };
        }),
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to read this file. Please try again.",
      );
    } finally {
      setBusy(false);
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
          <DialogTitle>Bulk upload {kind}</DialogTitle>
          <DialogDescription>
            Add multiple {kind} together. Review every row before anything is
            saved.
          </DialogDescription>
        </DialogHeader>
        <div className="cm-steps">
          <span className="active">1 · Prepare CSV</span>
          <span className={rows.length ? "active" : ""}>2 · Review rows</span>
          <span>3 · Import</span>
        </div>
        <div className="cm-template">
          <div>
            <strong>Start with the template</strong>
            <p>
              Use existing category{kind === "skills" ? " and competency" : ""}{" "}
              names. Up to 1,000 rows · CSV · 2 MB.
            </p>
          </div>
          <button
            className="cm-button"
            onClick={() => download(kind + "-template.csv", [headers])}
          >
            <Download size={16} />
            Download template
          </button>
        </div>
        <label
          className="cm-drop"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void load(e.dataTransfer.files[0]);
          }}
        >
          <Upload size={28} />
          <strong>{fileName || "Choose a CSV file or drop it here"}</strong>
          <span>Nothing is imported until you confirm.</span>
          <input
            aria-label="CSV file"
            type="file"
            accept=".csv,text/csv"
            disabled={busy}
            onChange={(e) => void load(e.target.files?.[0])}
          />
        </label>
        {busy && <p role="status">Checking your file…</p>}
        {error && (
          <p className="cm-error" role="alert">
            {error}
          </p>
        )}
        {rows.length > 0 && (
          <>
            <div className="cm-toolbar">
              <strong>
                <FileCheck2 size={18} /> {rows.length} rows reviewed
              </strong>
              <span>
                {rows.length - invalid.length} ready · {invalid.length} need
                attention
              </span>
              {invalid.length > 0 && (
                <button
                  className="cm-button"
                  onClick={() =>
                    download("import-errors.csv", [
                      ["Row", "Name", "Errors"],
                      ...invalid.map((r) => [
                        String(r.line),
                        r.item.name,
                        r.errors.join(" "),
                      ]),
                    ])
                  }
                >
                  Download errors
                </button>
              )}
            </div>
            {invalid.length > 0 && (
              <p className="cm-error">
                Fix the highlighted rows and upload your file again. No rows
                have been imported.
              </p>
            )}
            <div className="cm-table-wrap cm-preview">
              <table>
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Name</th>
                    <th>Validation</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.line}>
                      <td>{r.line}</td>
                      <td>{r.item.name || "Missing name"}</td>
                      <td className={r.errors.length ? "cm-invalid" : ""}>
                        {r.errors.join(" ") || "Ready to import"}
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
            disabled={busy || !rows.length || invalid.length > 0}
            onClick={() => onImport(rows.map((r) => r.item))}
          >
            Import {rows.length || ""} {kind}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
