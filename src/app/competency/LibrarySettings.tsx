import { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Ban } from "lucide-react";
import { Data, RecordItem, used } from "./model";
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
    [deleting, setDeleting] = useState<RecordItem | null>(null),
    [inactivating, setInactivating] = useState<RecordItem | null>(null);

  function applyLevelOrder(allLevels: RecordItem[], newItem: RecordItem, isNew: boolean): RecordItem[] {
    const maxPos = isNew ? allLevels.length + 1 : allLevels.length;
    const targetPos = Math.max(1, Math.min(maxPos, newItem.order ?? maxPos));
    const others = isNew ? allLevels : allLevels.filter((l) => l.id !== newItem.id);
    const sorted = [...others].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    sorted.splice(targetPos - 1, 0, newItem);
    return sorted.map((l, i) => ({ ...l, order: i + 1 }));
  }
  useEffect(() => {
    setSection(initialSection);
    setQuery("");
  }, [initialSection]);
  const records = data[section]
    .filter(
      (x) =>
        (x.name + " " + x.description)
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (!status || x.status === status),
    )
    .sort((a, b) =>
      section === "levels" ? (a.order ?? 999) - (b.order ?? 999) : 0,
    );
  return (
    <section className="cm-card">
      <div className="cm-section-head">
        <div>
          <h2>Library settings</h2>
          <p>Manage categories and proficiency levels used across your competency framework.</p>
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
      </div>
      <div className="cm-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              {section === "levels" && <th style={{ width: 80 }}>Order</th>}
              <th>Status</th>
              <th className="cm-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              return (
              <tr key={r.id}>
                <td>
                  <strong>{r.name}</strong>
                  <small>{r.description || "No description added"}</small>
                </td>
                {section === "levels" && (
                  <td style={{ color: "#526176", fontSize: 14 }}>{r.order ?? "—"}</td>
                )}
                <td>
                  <span className={"cm-badge " + r.status.toLowerCase()}>
                    {r.status}
                  </span>
                </td>
                <td>
                  <div className="cm-row-actions">
                    <button
                      className="cm-icon-button"
                      aria-label={"Edit " + r.name}
                      onClick={() => setEditing({ item: r })}
                    >
                      <Pencil size={16} />
                    </button>
                    {section === "levels" && r.status === "Active" && (
                      <button
                        className="cm-icon-button"
                        aria-label={"Inactivate " + r.name}
                        title="Inactivate"
                        onClick={() => setInactivating(r)}
                      >
                        <Ban size={16} />
                      </button>
                    )}
                    <button
                      className="cm-icon-button danger"
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
      {editing && (
        <Editor
          kind={section}
          data={data}
          item={editing.item}
          onClose={() => setEditing(null)}
          onSave={(item) => {
            const isNew = !editing.item;
            const nextData =
              section === "levels"
                ? { ...data, levels: applyLevelOrder(data.levels, item, isNew) }
                : {
                    ...data,
                    [section]: isNew
                      ? [...data[section], item]
                      : data[section].map((x) => (x.id === item.id ? item : x)),
                  };
            if (commit(nextData, "Saved successfully")) setEditing(null);
          }}
        />
      )}
      {inactivating && (
        <Dialog open onOpenChange={(open) => { if (!open) setInactivating(null); }}>
          <DialogContent className="cm-dialog">
            <DialogHeader>
              <DialogTitle>
                {used(data, "levels", inactivating.id)
                  ? `${inactivating.name} is mapped to a competency, skill, role, course, or learner usage and cannot be inactivated`
                  : `Are you sure you want to inactivate ${inactivating.name}?`}
              </DialogTitle>
              <DialogDescription />
            </DialogHeader>
            <div className="cm-dialog-actions">
              <button className="cm-button" onClick={() => setInactivating(null)}>Cancel</button>
              {!used(data, "levels", inactivating.id) && (
                <button
                  className="cm-button destructive"
                  onClick={() => {
                    if (
                      commit(
                        { ...data, levels: data.levels.map((x) => x.id === inactivating.id ? { ...x, status: "Inactive" } : x) },
                        `${inactivating.name} inactivated`,
                      )
                    )
                      setInactivating(null);
                  }}
                >
                  Inactivate
                </button>
              )}
            </div>
          </DialogContent>
        </Dialog>
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
              <DialogTitle>
                {section === "levels"
                  ? used(data, "levels", deleting.id)
                    ? `${deleting.name} is mapped to a skill, role, course, or learner usage and cannot be deleted.`
                    : `Are you sure you want to delete ${deleting.name}?`
                  : used(data, section, deleting.id)
                    ? `${deleting.name} is mapped to a competency and cannot be inactivated.`
                    : `Are you sure you want to inactivate ${deleting.name}?`}
              </DialogTitle>
              <DialogDescription />
            </DialogHeader>
            <div className="cm-dialog-actions">
              <button className="cm-button" onClick={() => setDeleting(null)}>
                Cancel
              </button>
              {!used(data, section, deleting.id) && (
                <button
                  className="cm-button destructive"
                  onClick={() => {
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
                  Delete
                </button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
