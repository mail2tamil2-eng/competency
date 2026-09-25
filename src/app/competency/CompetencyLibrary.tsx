import { useState, useEffect } from "react";
import {
  Layers,
  Target,
  Plus,
  Upload,
  Download,
  Search,
  Pencil,
  Trash2,
  Settings2,
  ArrowLeft,
  ChevronRight,
  Link2,
} from "lucide-react";
import { Data, RecordItem, Kind, used, download } from "./model";
import { WorkflowData, Course } from "./workflowModel";
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

type ViewState =
  | { kind: "list" }
  | { kind: "skills"; cId: string }
  | { kind: "skill-detail"; cId: string; sId: string };

export function CompetencyLibrary({
  data,
  query,
  onQuery,
  intent,
  onSettings,
  commit,
  work,
  onSaveWork,
}: {
  data: Data;
  query: string;
  onQuery: (value: string) => void;
  intent: LibraryIntent;
  onSettings: () => void;
  commit: (data: Data, message: string) => boolean;
  work?: WorkflowData;
  onSaveWork?: (work: WorkflowData, message: string) => boolean;
}) {
  const [view, setView] = useState<ViewState>({ kind: "list" }),
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
      setView({ kind: "list" });
    }
    if (intent?.action === "open" && intent.id)
      setView({ kind: "skills", cId: intent.id });
  }, [intent]);

  useEffect(() => setPage(1), [query, category, status]);

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
  const pages = Math.max(1, Math.ceil(visible.length / 10));
  const current = Math.min(page, pages);

  const competencyOf = (cId: string) =>
    data.competencies.find((c) => c.id === cId);
  const skillsOf = (cId: string) =>
    data.skills.filter((s) => s.competencyId === cId);
  const levelName = (lId: string) =>
    data.levels.find((l) => l.id === lId)?.name || lId;
  const coursesForSkill = (sId: string) =>
    (work?.courses ?? []).filter((c) =>
      c.mappings.some((m) => m.skillId === sId),
    );

  function updateWeightage(
    course: Course,
    skillId: string,
    levelId: string,
    weightage: number,
  ) {
    if (!work || !onSaveWork) return;
    onSaveWork(
      {
        ...work,
        courses: work.courses.map((c) =>
          c.id === course.id
            ? {
                ...c,
                mappings: c.mappings.map((m) =>
                  m.skillId === skillId && m.levelId === levelId
                    ? { ...m, weightage }
                    : m,
                ),
              }
            : c,
        ),
      },
      "Course weightage updated",
    );
  }

  const sharedModals = (
    <>
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
                `Created "${competency.name}" with ${skills.length} ${skills.length === 1 ? "skill" : "skills"}`,
              )
            ) {
              setCreating(false);
              setView({ kind: "skills", cId: competency.id });
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
    </>
  );

  /* ── SKILL DETAIL VIEW ── */
  if (view.kind === "skill-detail") {
    const comp = competencyOf(view.cId);
    const skill = data.skills.find((s) => s.id === view.sId);
    if (!comp || !skill) {
      setView({ kind: "list" });
      return null;
    }
    const definedLevels = data.levels.filter((l) => skill.levels?.[l.id]);
    const courses = coursesForSkill(skill.id);

    return (
      <section className="cm-card cm-unified-library">
        <button
          className="cm-text-button"
          onClick={() => setView({ kind: "skills", cId: view.cId })}
        >
          <ArrowLeft size={15} />
          Back to {comp.name}
        </button>

        <div className="cm-section-head" style={{ marginTop: 18 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0 }}>{skill.name}</h2>
              <span className={"cm-badge " + skill.status.toLowerCase()}>
                {skill.status}
              </span>
            </div>
            {skill.description && (
              <p style={{ marginTop: 6 }}>{skill.description}</p>
            )}
          </div>
          <button
            className="cm-icon-button"
            aria-label={"Edit " + skill.name}
            onClick={() =>
              setEditing({ kind: "skills", item: skill, parent: comp })
            }
          >
            <Pencil size={16} />
          </button>
        </div>

        {/* Proficiency levels — tree structure */}
        <h3>Proficiency levels</h3>
        {!definedLevels.length ? (
          <p className="cm-hint">
            No proficiency levels defined for this skill. Edit the skill to add
            level descriptions.
          </p>
        ) : (
          <div className="cm-level-tree">
            {definedLevels.map((l, i) => (
              <div
                key={l.id}
                className={
                  "cm-level-node" +
                  (i === definedLevels.length - 1 ? " last" : "")
                }
              >
                <div className="cm-level-node-marker" />
                <div className="cm-level-node-content">
                  <strong>{l.name}</strong>
                  <p>{skill.levels?.[l.id]}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mapped courses */}
        <h3 style={{ marginTop: 24 }}>Mapped courses</h3>
        {!courses.length ? (
          <p className="cm-hint">
            No courses mapped to this skill yet. Go to the{" "}
            <strong>Course mapping</strong> tab to connect courses.
          </p>
        ) : (
          <div className="cm-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Level</th>
                  <th>Weightage (%)</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {courses.flatMap((c) =>
                  c.mappings
                    .filter((m) => m.skillId === skill.id)
                    .map((m) => (
                      <tr key={c.id + "-" + m.levelId}>
                        <td>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              color: "#2463d6",
                              fontWeight: 600,
                            }}
                          >
                            <Link2 size={13} />
                            {c.name}
                          </span>
                          <small>Demo course</small>
                        </td>
                        <td>
                          <span className="cm-category">
                            {levelName(m.levelId)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              className="cm-weightage-input"
                              value={m.weightage ?? 0}
                              onChange={(e) =>
                                updateWeightage(
                                  c,
                                  skill.id,
                                  m.levelId,
                                  Math.max(0, Math.min(100, Number(e.target.value))),
                                )
                              }
                            />
                            <span style={{ fontSize: 13, color: "#526176" }}>
                              {(m.weightage ?? 0) === 0 ? "Not mandatory" : "Important"}
                            </span>
                          </div>
                        </td>
                        <td>{c.duration}</td>
                      </tr>
                    )),
                )}
              </tbody>
            </table>
          </div>
        )}
        {sharedModals}
      </section>
    );
  }

  /* ── SKILLS VIEW ── */
  if (view.kind === "skills") {
    const comp = competencyOf(view.cId);
    if (!comp) {
      setView({ kind: "list" });
      return null;
    }
    const skills = skillsOf(comp.id);
    const catName =
      data.categories.find((x) => x.id === comp.categoryId)?.name ||
      "Uncategorised";

    return (
      <section className="cm-card cm-unified-library">
        <button
          className="cm-text-button"
          onClick={() => setView({ kind: "list" })}
        >
          <ArrowLeft size={15} />
          Back to competencies
        </button>

        <div className="cm-section-head" style={{ marginTop: 18 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0 }}>{comp.name}</h2>
              <span className="cm-category">{catName}</span>
              <span className={"cm-badge " + comp.status.toLowerCase()}>
                {comp.status}
              </span>
            </div>
            {comp.description && (
              <p style={{ marginTop: 6 }}>{comp.description}</p>
            )}
          </div>
          <div className="cm-actions">
            <button
              className="cm-icon-button"
              aria-label={"Edit " + comp.name}
              onClick={() => setEditing({ kind: "competencies", item: comp })}
            >
              <Pencil size={16} />
            </button>
            <button
              className="cm-button primary"
              disabled={comp.status !== "Active"}
              title={
                comp.status !== "Active"
                  ? "Set this competency to Active before adding skills"
                  : ""
              }
              onClick={() => setEditing({ kind: "skills", parent: comp })}
            >
              <Plus size={15} />
              Add skill
            </button>
          </div>
        </div>

        {comp.status !== "Active" && (
          <p className="cm-hint">
            Set this competency to Active using Edit before adding skills.
          </p>
        )}

        {skills.length ? (
          <div className="cm-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>Proficiency levels</th>
                  <th>Status</th>
                  <th className="cm-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {skills.map((s) => {
                  const levelCount = data.levels.filter(
                    (l) => s.levels?.[l.id],
                  ).length;
                  return (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.name}</strong>
                        <small>{s.description || "No description"}</small>
                      </td>
                      <td>
                        {levelCount}{" "}
                        {levelCount === 1 ? "level" : "levels"} defined
                      </td>
                      <td>
                        <span className={"cm-badge " + s.status.toLowerCase()}>
                          {s.status}
                        </span>
                      </td>
                      <td>
                        <div className="cm-row-actions">
                          <button
                            className="cm-button"
                            onClick={() =>
                              setView({
                                kind: "skill-detail",
                                cId: comp.id,
                                sId: s.id,
                              })
                            }
                          >
                            View <ChevronRight size={14} />
                          </button>
                          <button
                            className="cm-icon-button"
                            aria-label={"Edit " + s.name}
                            onClick={() =>
                              setEditing({
                                kind: "skills",
                                item: s,
                                parent: comp,
                              })
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="cm-empty">
            <Target size={24} />
            <h3>No skills yet</h3>
            <p>Add the specific abilities that make up this competency.</p>
          </div>
        )}
        {sharedModals}
      </section>
    );
  }

  /* ── LIST VIEW (default) ── */
  return (
    <section className="cm-card cm-unified-library">
      <div className="cm-section-head">
        <div>
          <h2>Competencies &amp; Skills</h2>
          <p>
            Competencies group related skills. Select a competency to view and
            manage its skills.
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
            Create competency
          </button>
        </div>
      </div>

      <div className="cm-toolbar">
        <label className="cm-search">
          <Search size={17} />
          <input
            aria-label="Search competencies and skills"
            placeholder="Search a competency or skill…"
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

      {visible.length > 0 ? (
        <>
          <div className="cm-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Competency</th>
                  <th>Category</th>
                  <th>Skills</th>
                  <th>Status</th>
                  <th className="cm-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible
                  .slice((current - 1) * 10, current * 10)
                  .map((c) => {
                    const children = data.skills.filter(
                      (s) => s.competencyId === c.id,
                    );
                    return (
                      <tr key={c.id}>
                        <td>
                          <strong>{c.name}</strong>
                          <small>
                            {c.description ||
                              "No description added"}
                          </small>
                        </td>
                        <td>
                          <span className="cm-category">
                            {data.categories.find(
                              (x) => x.id === c.categoryId,
                            )?.name || "Uncategorised"}
                          </span>
                        </td>
                        <td>
                          {children.length}{" "}
                          {children.length === 1 ? "skill" : "skills"}
                        </td>
                        <td>
                          <span
                            className={
                              "cm-badge " + c.status.toLowerCase()
                            }
                          >
                            {c.status}
                          </span>
                        </td>
                        <td>
                          <div className="cm-row-actions">
                            <button
                              className="cm-button"
                              onClick={() =>
                                setView({ kind: "skills", cId: c.id })
                              }
                            >
                              <Layers size={14} />
                              View skills
                            </button>
                            <button
                              className="cm-icon-button"
                              aria-label={"Edit " + c.name}
                              onClick={() =>
                                setEditing({
                                  kind: "competencies",
                                  item: c,
                                })
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
                                  : "Delete competency"
                              }
                              onClick={() =>
                                setDeleting({ kind: "competencies", item: c })
                              }
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

          <footer className="cm-pagination">
            <span>
              {visible.length} competencies found
              {term ? " · Matching skills visible inside each competency" : ""}
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
        </>
      ) : (
        <div className="cm-empty">
          <Search size={26} />
          <h3>No matching competencies or skills</h3>
          <p>Try another name or clear the filters.</p>
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

      {sharedModals}
    </section>
  );
}
