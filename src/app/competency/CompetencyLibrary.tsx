import { useState, useEffect } from "react";
import {
  Layers,
  Target,
  Plus,
  Upload,
  Download,
  Search,
  ChevronDown,
  Pencil,
  Trash2,
  Settings2,
} from "lucide-react";
import { Data, RecordItem, Kind, used, download } from "./model";
import { LibraryCreate } from "./LibraryCreate";
import { LibraryBulkUpload } from "./LibraryBulkUpload";
import { libraryHeaders, libraryRows } from "./libraryImport";
import { Editor } from "./Editor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
export type LibraryIntent = {
  action: "create" | "open" | "search";
  id?: string;
  nonce: number;
} | null;
export function CompetencyLibrary({
  data,
  query,
  onQuery,
  intent,
  onSettings,
  commit,
}: {
  data: Data;
  query: string;
  onQuery: (value: string) => void;
  intent: LibraryIntent;
  onSettings: () => void;
  commit: (data: Data, message: string) => boolean;
}) {
  const [expanded, setExpanded] = useState<string[]>([]),
    [category, setCategory] = useState(""),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1),
    [creating, setCreating] = useState(false),
    [uploading, setUploading] = useState(false),
    [editing, setEditing] = useState<{
      kind: "competencies" | "skills";
      item?: RecordItem;
      parent?: RecordItem;
    } | null>(null),
    [deleting, setDeleting] = useState<{ kind: Kind; item: RecordItem } | null>(
      null,
    );
  useEffect(() => {
    if (intent?.action === "create") setCreating(true);
    if (intent?.action === "search") {
      setCategory("");
      setStatus("");
      setPage(1);
    }
    if (intent?.action === "open" && intent.id) setExpanded([intent.id]);
  }, [intent]);
  useEffect(() => setPage(1), [query, category, status]);
  useEffect(() => {
    const term = query.trim().toLowerCase();
    if (term)
      setExpanded(
        data.competencies
          .filter(
            (c) =>
              (c.name + " " + c.description).toLowerCase().includes(term) ||
              data.skills.some(
                (s) =>
                  s.competencyId === c.id &&
                  (s.name + " " + s.description).toLowerCase().includes(term),
              ),
          )
          .map((c) => c.id),
      );
  }, [query, data]);
  const term = query.trim().toLowerCase();
  const matches = (r: RecordItem) =>
    (r.name + " " + r.description).toLowerCase().includes(term);
  const visible = data.competencies.filter(
    (c) =>
      (!category || c.categoryId === category) &&
      (!status || c.status === status) &&
      (!term ||
        matches(c) ||
        data.skills.some((s) => s.competencyId === c.id && matches(s))),
  );
  const pages = Math.max(1, Math.ceil(visible.length / 6)),
    current = Math.min(page, pages);
  function toggle(id: string) {
    setExpanded((list) =>
      list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
    );
  }
  return (
    <section className="cm-card cm-unified-library">
      <div className="cm-section-head">
        <div>
          <h2>Skill Groups &amp; Skills</h2>
          <p>
            A skill group bundles related skills together — for example, "Leadership" or "Data Analysis". Open one to see the individual skills inside it.
          </p>
        </div>
        <div className="cm-actions">
          <button className="cm-button" onClick={() => setUploading(true)}>
            <Upload size={16} />
            Bulk upload
          </button>
          <button
            className="cm-button primary"
            onClick={() => setCreating(true)}
          >
            <Plus size={16} />
            Create skill group
          </button>
        </div>
      </div>
      <div className="cm-toolbar">
        <label className="cm-search">
          <Search size={17} />
          <input
            aria-label="Search skill groups and skills"
            placeholder="Search a skill group or skill…"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
          />
        </label>
        {term && (
          <button className="cm-text-button" onClick={() => onQuery("")}>
            Clear search
          </button>
        )}
        <select
          aria-label="Filter library by category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {data.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter competency status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option>Active</option>
          <option>Draft</option>
          <option>Inactive</option>
        </select>
        <button
          className="cm-button"
          onClick={() =>
            download("competencies-and-skills.csv", [
              libraryHeaders(data),
              ...libraryRows(data, visible),
            ])
          }
        >
          <Download size={16} />
          Export CSV
        </button>
        <button className="cm-text-button" onClick={onSettings}>
          <Settings2 size={15} />
          Library settings
        </button>
      </div>
      <div className="cm-library-groups">
        {visible.slice((current - 1) * 6, current * 6).map((c) => {
          const children = data.skills.filter((s) => s.competencyId === c.id);
          const open = expanded.includes(c.id);
          const shown =
            term && !matches(c) ? children.filter(matches) : children;
          return (
            <article
              className="cm-library-group"
              key={c.id}
              aria-label={c.name + " skill group"}
            >
              <div className="cm-group-header">
                <button
                  className="cm-group-toggle"
                  aria-label={"Expand " + c.name}
                  aria-expanded={open}
                  aria-controls={"skills-" + c.id}
                  onClick={() => toggle(c.id)}
                >
                  <span className="cm-mini-icon">
                    <Layers size={20} />
                  </span>
                  <span>
                    <strong>{c.name}</strong>
                    <small>
                      {c.description ||
                        "Add a description to explain this capability."}
                    </small>
                  </span>
                  <span className="cm-group-meta">
                    <span className="cm-category">
                      {data.categories.find((x) => x.id === c.categoryId)
                        ?.name || "Uncategorized"}
                    </span>
                    <span>
                      {children.length}{" "}
                      {children.length === 1 ? "skill" : "skills"}
                    </span>
                  </span>
                  <span className={"cm-badge " + c.status.toLowerCase()}>
                    {c.status}
                  </span>
                  <ChevronDown size={18} className={open ? "cm-rotated" : ""} />
                </button>
                <div className="cm-row-actions">
                  <button
                    className="cm-icon-button"
                    aria-label={"Edit " + c.name}
                    onClick={() =>
                      setEditing({ kind: "competencies", item: c })
                    }
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="cm-icon-button danger"
                    aria-label={"Delete " + c.name}
                    disabled={used(data, "competencies", c.id)}
                    title={
                      used(data, "competencies", c.id)
                        ? "Contains skills; remove unused skills first"
                        : "Delete skill group"
                    }
                    onClick={() =>
                      setDeleting({ kind: "competencies", item: c })
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {open && (
                <div id={"skills-" + c.id} className="cm-group-skills">
                  <div className="cm-skills-heading">
                    <span>
                      <Target size={15} />
                      Skills in {c.name}
                    </span>
                    <button
                      className="cm-button"
                      disabled={c.status !== "Active"}
                      title={
                        c.status !== "Active"
                          ? "Edit this skill group and set it to Active before adding skills"
                          : ""
                      }
                      onClick={() => setEditing({ kind: "skills", parent: c })}
                    >
                      <Plus size={15} />
                      Add skill
                    </button>
                  </div>
                  {c.status !== "Active" && (
                    <p className="cm-hint">
                      This skill group is not Active yet. Edit it and set the status to Active before adding skills.
                    </p>
                  )}
                  {!shown.length && (
                    <div className="cm-empty">
                      <Target size={24} />
                      <h3>No skills yet</h3>
                      <p>
                        Skills are the specific things a person can do inside this group. Add the first one to get started.
                      </p>
                    </div>
                  )}
                  {shown.map((s) => (
                    <div className="cm-nested-skill" key={s.id}>
                      <div className="cm-skill-row">
                        <span className="cm-skill-branch">
                          <Target size={17} />
                        </span>
                        <div>
                          <strong>{s.name}</strong>
                          <small>
                            {s.description || "No description added"}
                          </small>
                        </div>
                        <span className={"cm-badge " + s.status.toLowerCase()}>
                          {s.status}
                        </span>
                        <div className="cm-row-actions">
                          <button
                            className="cm-icon-button"
                            aria-label={"Edit " + s.name}
                            onClick={() =>
                              setEditing({ kind: "skills", item: s, parent: c })
                            }
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="cm-icon-button danger"
                            aria-label={"Delete " + s.name}
                            disabled={used(data, "skills", s.id)}
                            title={
                              used(data, "skills", s.id)
                                ? "Used by learners or courses"
                                : "Delete skill"
                            }
                            onClick={() =>
                              setDeleting({ kind: "skills", item: s })
                            }
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                      <details className="cm-skill-proficiency">
                        <summary>
                          View skill levels{" "}
                          <span>
                            {data.levels.filter((l) => s.levels?.[l.id]).length}{" "}
                            levels
                          </span>
                        </summary>
                        <div className="cm-level-track">
                          {data.levels
                            .filter((l) => s.levels?.[l.id])
                            .map((l) => (
                              <div key={l.id}>
                                <strong>{l.name}</strong>
                                <small>{s.levels?.[l.id]}</small>
                              </div>
                            ))}
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
      {!visible.length && (
        <div className="cm-empty">
          <Search size={26} />
          <h3>No matching skill groups or skills</h3>
          <p>Try a different search term or clear the filters.</p>
          <button
            className="cm-button"
            onClick={() => {
              onQuery("");
              setCategory("");
              setStatus("");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      <footer className="cm-pagination">
        <span>
          {visible.length} skill {visible.length === 1 ? "group" : "groups"} found
          {term ? " · Matching skills are shown inside each group" : ""}
        </span>
        <div>
          <button
            className="cm-button"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            Previous
          </button>
          <span>
            Page {current} of {pages}
          </span>
          <button
            className="cm-button"
            disabled={current === pages}
            onClick={() => setPage(current + 1)}
          >
            Next
          </button>
        </div>
      </footer>
      {creating && (
        <LibraryCreate
          data={data}
          onClose={() => setCreating(false)}
          onSave={(competency, skills) => {
            if (
              commit(
                {
                  ...data,
                  competencies: [...data.competencies, competency],
                  skills: [...data.skills, ...skills],
                },
                `Created skill group "${competency.name}" with ${skills.length} ${skills.length === 1 ? "skill" : "skills"}`,
              )
            ) {
              setCreating(false);
              setExpanded([competency.id]);
              onQuery(competency.name);
              setCategory("");
              setStatus("");
              setPage(1);
            }
          }}
        />
      )}
      {uploading && (
        <LibraryBulkUpload
          data={data}
          onClose={() => setUploading(false)}
          onImport={(result) => {
            if (
              commit(
                {
                  ...data,
                  competencies: [...data.competencies, ...result.competencies],
                  skills: [...data.skills, ...result.skills],
                },
                result.competencies.length +
                  " competencies and " +
                  result.skills.length +
                  " skills imported",
              )
            ) {
              setUploading(false);
              setExpanded([
                ...new Set([
                  ...result.competencies.map((c) => c.id),
                  ...result.skills.map((s) => s.competencyId!),
                ]),
              ]);
              onQuery("");
              setCategory("");
              setStatus("");
              setPage(1);
            }
          }}
        />
      )}
      {editing && (
        <Editor
          key={editing.item?.id || editing.parent?.id || editing.kind}
          kind={editing.kind}
          data={data}
          item={editing.item}
          parent={editing.parent}
          onClose={() => setEditing(null)}
          onSave={(item) => {
            const list = data[editing.kind];
            if (
              commit(
                {
                  ...data,
                  [editing.kind]: editing.item
                    ? list.map((x) => (x.id === item.id ? item : x))
                    : [...list, item],
                },
                "Saved successfully",
              )
            ) {
              setEditing(null);
              if (item.competencyId)
                setExpanded((ids) => [
                  ...new Set([...ids, item.competencyId!]),
                ]);
            }
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
              <DialogTitle>Delete {deleting.item.name}?</DialogTitle>
              <DialogDescription>
                This removes the item from your library. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="cm-dialog-actions">
              <button className="cm-button" onClick={() => setDeleting(null)}>
                Keep item
              </button>
              <button
                className="cm-button destructive"
                onClick={() => {
                  if (used(data, deleting.kind, deleting.item.id)) return;
                  if (
                    commit(
                      {
                        ...data,
                        [deleting.kind]: data[deleting.kind].filter(
                          (x) => x.id !== deleting.item.id,
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
