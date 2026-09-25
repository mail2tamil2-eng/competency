import { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Download } from "lucide-react";
import { Data, RecordItem, used, download } from "./model";
import { Editor } from "./Editor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
export function LibrarySettings({
  data,
  initialSection,
  commit,
}: {
  data: Data;
  initialSection: "categories" | "levels";
  commit: (data: Data, message: string) => boolean;
}) {
  const [section, setSection] = useState(initialSection),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [editing, setEditing] = useState<{ item?: RecordItem } | null>(null),
    [deleting, setDeleting] = useState<RecordItem | null>(null);

  function reorderLevel(fromIdx: number, toPos: number) {
    const list = [...data.levels];
    const toIdx = Math.max(0, Math.min(list.length - 1, toPos - 1));
    if (fromIdx === toIdx) return;
    const [item] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, item);
    commit({ ...data, levels: list }, "Level order updated");
  }
  useEffect(() => {
    setSection(initialSection);
    setQuery("");
  }, [initialSection]);
  const records = data[section].filter(
    (x) =>
      (x.name + " " + x.description)
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (!status || x.status === status),
  );
  return (
    <section className="cm-card">
      <div className="cm-section-head">
        <div>
          <h2>Library settings</h2>
        </div>
        <div className="cm-settings-tabs-bar">
          <div
            className="cm-settings-tabs"
            role="group"
            aria-label="Library settings sections"
          >
            {(["categories", "levels"] as const).map((s) => (
              <button
                className={section === s ? "active" : ""}
                aria-pressed={section === s}
                key={s}
                onClick={() => {
                  setSection(s);
                  setQuery("");
                  setStatus("");
                }}
              >
                {s === "categories" ? "Categories" : "Proficiency levels"}
                <span className="cm-tab-count">{data[s].length}</span>
              </button>
            ))}
          </div>
          <button className="cm-button primary" onClick={() => setEditing({})}>
            <Plus size={16} />
            Add {section === "categories" ? "category" : "level"}
          </button>
        </div>
      </div>
      <div className="cm-toolbar">
        <label className="cm-search">
          <Search size={17} />
          <input
            aria-label="Search library settings"
            placeholder={"Search " + section + "…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Filter settings status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
        <button
          className="cm-button"
          onClick={() =>
            download(section + ".csv", [
              ["Name", "Description", "Status"],
              ...records.map((r) => [r.name, r.description, r.status]),
            ])
          }
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>
      <div className="cm-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              {section === "levels" && <th>Order</th>}
              <th className="cm-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const globalIdx = section === "levels" ? data.levels.findIndex((l) => l.id === r.id) : -1;
              return (
              <tr key={r.id}>
                <td>
                  <strong>{r.name}</strong>
                  <small>{r.description || "No description added"}</small>
                </td>
                <td>
                  <span className={"cm-badge " + r.status.toLowerCase()}>
                    {r.status}
                  </span>
                </td>
                {section === "levels" && (
                  <td>
                    <input
                      type="number"
                      min={1}
                      max={data.levels.length}
                      key={globalIdx}
                      defaultValue={globalIdx + 1}
                      className="cm-order-input"
                      aria-label={"Order position for " + r.name}
                      title="Type a number and press Enter to move"
                      onBlur={(e) => {
                        const pos = parseInt(e.target.value);
                        if (!isNaN(pos)) reorderLevel(globalIdx, pos);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                        if (e.key === "Escape") {
                          (e.target as HTMLInputElement).value = String(globalIdx + 1);
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                    />
                  </td>
                )}
                <td>
                  <div className="cm-row-actions">
                    <button
                      className="cm-icon-button"
                      aria-label={"Edit " + r.name}
                      onClick={() => setEditing({ item: r })}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="cm-icon-button danger"
                      disabled={used(data, section, r.id)}
                      title={
                        used(data, section, r.id)
                          ? "In use; remove mappings before deleting"
                          : "Delete"
                      }
                      aria-label={"Delete " + r.name}
                      onClick={() => setDeleting(r)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!records.length && (
        <p className="cm-empty">
          No matching {section}. Try another search or add an item.
        </p>
      )}
      <p className="cm-hint">
        Items already used by skills, skill groups, or learners cannot be deleted or deactivated.
      </p>
      {editing && (
        <Editor
          kind={section}
          data={data}
          item={editing.item}
          onClose={() => setEditing(null)}
          onSave={(item) => {
            if (
              commit(
                {
                  ...data,
                  [section]: editing.item
                    ? data[section].map((x) => (x.id === item.id ? item : x))
                    : [...data[section], item],
                },
                "Saved successfully",
              )
            )
              setEditing(null);
          }}
        />
      )}
      {deleting && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setDeleting(null);
          }}
        >
          <DialogContent className="cm-dialog">
            <DialogHeader>
              <DialogTitle>Delete {deleting.name}?</DialogTitle>
              <DialogDescription>
                This removes the unused item. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="cm-dialog-actions">
              <button className="cm-button" onClick={() => setDeleting(null)}>
                Keep item
              </button>
              <button
                className="cm-button destructive"
                onClick={() => {
                  if (used(data, section, deleting.id)) return;
                  if (
                    commit(
                      {
                        ...data,
                        [section]: data[section].filter(
                          (x) => x.id !== deleting.id,
                        ),
                      },
                      "Item deleted",
                    )
                  )
                    setDeleting(null);
                }}
              >
                Delete item
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
