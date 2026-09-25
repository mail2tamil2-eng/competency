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
  ChevronDown,
  BookOpen,
  X,
} from "lucide-react";
import { Data, RecordItem, Kind, used, download, uid, validate } from "./model";
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

type ViewState = { kind: "list" } | { kind: "skills"; cId: string };

/* ── Inline skill edit form ── */
function SkillInlineEdit({
  skill,
  data,
  onSave,
  onCancel,
}: {
  skill: RecordItem;
  data: Data;
  onSave: (item: RecordItem) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<RecordItem>(structuredClone(skill));
  const [errors, setErrors] = useState<string[]>([]);

  function setLevel(levelId: string, desc: string) {
    setDraft((d) => ({ ...d, levels: { ...d.levels, [levelId]: desc } }));
  }

  function save() {
    const errs = validate(draft, "skills", data);
    if (errs.length) { setErrors(errs); return; }
    onSave({ ...draft, name: draft.name.trim(), description: draft.description.trim() });
  }

  return (
    <div className="cm-skill-inline-edit">
      {errors.length > 0 && (
        <p className="cm-error">{errors.join(" ")}</p>
      )}
      <div className="cm-skill-edit-fields">
        <label>
          Skill name *
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Skill name"
          />
        </label>
        <label>
          Status
          <select
            value={draft.status}
            onChange={(e) =>
              setDraft({ ...draft, status: e.target.value as RecordItem["status"] })
            }
          >
            <option>Active</option>
            <option>Inactive</option>
            <option>Draft</option>
          </select>
        </label>
      </div>
      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14, fontWeight: 600, color: "#636b7e" }}>
        Description
        <textarea
          rows={2}
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          placeholder="What does this skill mean?"
        />
      </label>
      {data.levels.filter((l) => l.status === "Active").length > 0 && (
        <div className="cm-skill-edit-levels">
          <strong>Proficiency level descriptions</strong>
          <small>Describe what this skill looks like at each level.</small>
          {data.levels
            .filter((l) => l.status === "Active")
            .map((l, i) => (
              <label key={l.id}>
                <span className="cm-level-num-badge">{i + 1}</span>
                {l.name}
                <textarea
                  rows={2}
                  value={draft.levels?.[l.id] || ""}
                  onChange={(e) => setLevel(l.id, e.target.value)}
                  placeholder={`What does ${l.name} look like for this skill?`}
                />
              </label>
            ))}
        </div>
      )}
      <div className="cm-skill-edit-actions">
        <button className="cm-button" onClick={onCancel}>Cancel</button>
        <button className="cm-button primary" onClick={save}>Save skill</button>
      </div>
    </div>
  );
}

/* ── Mapped courses popup (all courses for a skill) ── */
function CourseListPopup({
  courses,
  skill,
  data,
  work,
  onSaveWork,
  onClose,
}: {
  courses: { course: Course; mapping: { skillId: string; levelId: string; weightage?: number } }[];
  skill: RecordItem;
  data: Data;
  work: WorkflowData;
  onSaveWork: (work: WorkflowData, msg: string) => boolean;
  onClose: () => void;
}) {
  const [edits, setEdits] = useState(
    courses.map(({ course, mapping }) => ({
      courseId: course.id,
      levelId: mapping.levelId,
      weightage: mapping.weightage ?? 0,
    })),
  );

  function save() {
    const updated: WorkflowData = {
      ...work,
      courses: work.courses.map((c) => {
        const edit = edits.find((e) => e.courseId === c.id);
        if (!edit) return c;
        return {
          ...c,
          mappings: c.mappings.map((m) =>
            m.skillId === skill.id && m.levelId === edit.levelId
              ? { ...m, weightage: edit.weightage }
              : m,
          ),
        };
      }),
    };
    if (onSaveWork(updated, "Course weightages saved")) onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="cm-dialog">
        <DialogHeader>
          <DialogTitle>Mapped courses</DialogTitle>
          <DialogDescription>
            {skill.name} — {courses.length} course{courses.length !== 1 ? "s" : ""} mapped
          </DialogDescription>
        </DialogHeader>
        <div className="cm-course-popup-body">
          <div className="cm-course-popup-scroll">
            <table className="cm-course-popup-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Level</th>
                  <th>Weightage&nbsp;(%)</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(({ course, mapping }, i) => (
                  <tr key={course.id + mapping.levelId}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <BookOpen size={13} style={{ color: "#526176", flexShrink: 0 }} />
                        <span>{course.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="cm-category" style={{ fontSize: 12 }}>
                        {data.levels.find((l) => l.id === mapping.levelId)?.name || mapping.levelId}
                      </span>
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="cm-weightage-input"
                        value={edits[i].weightage}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, Number(e.target.value)));
                          setEdits(edits.map((ed, idx) => idx === i ? { ...ed, weightage: val } : ed));
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="cm-dialog-actions">
          <button className="cm-button" onClick={onClose}>Cancel</button>
          <button className="cm-button primary" onClick={save}>Save</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main component ── */
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
  const [view, setView] = useState<ViewState>({ kind: "list" });
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingComp, setEditingComp] = useState<RecordItem | null>(null);
  const [deleting, setDeleting] = useState<{ kind: Kind; item: RecordItem } | null>(null);

  // skills view state
  const [openSkill, setOpenSkill] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<string | null>(null);
  const [coursePopup, setCoursePopup] = useState<string | null>(null); // skill id

  useEffect(() => {
    if (intent?.action === "create") setCreating(true);
    if (intent?.action === "search") {
      setCategory(""); setStatus(""); setPage(1);
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
      (!term || matches(c) || data.skills.some((s) => s.competencyId === c.id && matches(s))),
  );
  const pages = Math.max(1, Math.ceil(visible.length / 10));
  const current = Math.min(page, pages);

  const levelName = (lId: string) =>
    data.levels.find((l) => l.id === lId)?.name || lId;
  const coursesForSkill = (sId: string) =>
    (work?.courses ?? []).filter((c) => c.mappings.some((m) => m.skillId === sId));

  function saveSkill(item: RecordItem) {
    const list = data.skills;
    if (
      commit(
        { ...data, skills: list.map((x) => (x.id === item.id ? item : x)) },
        "Skill saved",
      )
    )
      setEditingSkill(null);
  }

  /* shared modals */
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
                result.competencies.length + " competencies and " + result.skills.length + " skills imported",
              )
            ) {
              setUploading(false);
              onQuery(""); setCategory(""); setStatus(""); setPage(1);
            }
          }}
        />
      )}
      {editingComp && (
        <Editor
          kind="competencies"
          data={data}
          item={editingComp}
          onClose={() => setEditingComp(null)}
          onSave={(item) => {
            if (
              commit(
                { ...data, competencies: data.competencies.map((x) => (x.id === item.id ? item : x)) },
                "Saved successfully",
              )
            )
              setEditingComp(null);
          }}
        />
      )}
      {deleting && (
        <Dialog open onOpenChange={(open) => { if (!open) setDeleting(null); }}>
          <DialogContent className="cm-dialog">
            <DialogHeader>
              <DialogTitle>Delete {deleting.item.name}?</DialogTitle>
              <DialogDescription>
                This removes the item from your library. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="cm-dialog-actions">
              <button className="cm-button" onClick={() => setDeleting(null)}>Keep item</button>
              <button
                className="cm-button destructive"
                onClick={() => {
                  if (used(data, deleting.kind, deleting.item.id)) return;
                  if (
                    commit(
                      { ...data, [deleting.kind]: data[deleting.kind].filter((x) => x.id !== deleting.item.id) },
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
      {coursePopup && work && onSaveWork && (() => {
        const skill = data.skills.find((s) => s.id === coursePopup);
        if (!skill) return null;
        const mappings = coursesForSkill(skill.id).flatMap((c) =>
          c.mappings.filter((m) => m.skillId === skill.id).map((m) => ({ course: c, mapping: m })),
        );
        return mappings.length > 0 ? (
          <CourseListPopup
            courses={mappings}
            skill={skill}
            data={data}
            work={work}
            onSaveWork={onSaveWork}
            onClose={() => setCoursePopup(null)}
          />
        ) : null;
      })()}
    </>
  );

  /* ── SKILLS VIEW ── */
  if (view.kind === "skills") {
    const comp = data.competencies.find((c) => c.id === view.cId);
    if (!comp) { setView({ kind: "list" }); return null; }
    const skills = data.skills.filter((s) => s.competencyId === comp.id);
    const catName = data.categories.find((x) => x.id === comp.categoryId)?.name || "Uncategorised";

    return (
      <section className="cm-card cm-unified-library">
        <button className="cm-text-button" onClick={() => { setView({ kind: "list" }); setOpenSkill(null); setEditingSkill(null); }}>
          <ArrowLeft size={15} /> Back to competencies
        </button>

        <div className="cm-section-head" style={{ marginTop: 18 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0 }}>{comp.name}</h2>
              <span className="cm-category">{catName}</span>
              <span className={"cm-badge " + comp.status.toLowerCase()}>{comp.status}</span>
            </div>
            {comp.description && <p style={{ marginTop: 6 }}>{comp.description}</p>}
          </div>
          <div className="cm-actions">
            <button className="cm-icon-button" aria-label={"Edit " + comp.name} onClick={() => setEditingComp(comp)}>
              <Pencil size={16} />
            </button>
            <button
              className="cm-button primary"
              disabled={comp.status !== "Active"}
              title={comp.status !== "Active" ? "Set this competency to Active before adding skills" : ""}
              onClick={() => {
                /* open create-skill via Editor in "add" mode */
                setEditingSkill("__new__");
              }}
            >
              <Plus size={15} /> Add skill
            </button>
          </div>
        </div>

        {comp.status !== "Active" && (
          <p className="cm-hint">Set this competency to Active using Edit before adding skills.</p>
        )}

        {/* Add-skill inline form */}
        {editingSkill === "__new__" && (
          <div className="cm-card" style={{ margin: "12px 0", border: "1px solid #bed5ff" }}>
            <h3 style={{ marginBottom: 14 }}>New skill</h3>
            <SkillInlineEdit
              skill={{ id: uid(), name: "", description: "", status: "Active", levels: {}, competencyId: comp.id }}
              data={data}
              onSave={(item) => {
                if (commit({ ...data, skills: [...data.skills, item] }, `Added skill "${item.name}"`))
                  setEditingSkill(null);
              }}
              onCancel={() => setEditingSkill(null)}
            />
          </div>
        )}

        {/* Skill accordions */}
        {skills.length === 0 && editingSkill !== "__new__" ? (
          <div className="cm-empty">
            <Target size={24} />
            <h3>No skills yet</h3>
            <p>Add the specific abilities that make up this competency.</p>
          </div>
        ) : (
          <div className="cm-skill-accordion-list">
            {skills.map((s) => {
              const isOpen = openSkill === s.id;
              const isEditing = editingSkill === s.id;
              const definedLevels = data.levels.filter((l) => s.levels?.[l.id] && l.status === "Active");
              const courses = coursesForSkill(s.id);

              return (
                <div key={s.id} className={"cm-skill-accordion" + (isOpen ? " open" : "")}>
                  {/* Header row */}
                  <div className="cm-skill-accordion-header">
                    <button
                      className="cm-skill-accordion-toggle"
                      aria-expanded={isOpen}
                      onClick={() => {
                        if (isEditing) return;
                        setOpenSkill(isOpen ? null : s.id);
                      }}
                    >
                      <ChevronDown size={16} className={isOpen ? "cm-rotated" : ""} style={{ flexShrink: 0, color: "#526176" }} />
                      <span className="cm-skill-accordion-name">
                        <strong>{s.name}</strong>
                        {s.description && <small>{s.description}</small>}
                      </span>
                      <span className="cm-skill-accordion-meta">
                        <span className="cm-category">
                          {definedLevels.length} {definedLevels.length === 1 ? "level" : "levels"}
                        </span>
                        <span className={"cm-badge " + s.status.toLowerCase()}>{s.status}</span>
                      </span>
                    </button>
                    {courses.length > 0 && work && onSaveWork && (
                      <button
                        className="cm-course-count-badge"
                        title={`${courses.length} mapped course${courses.length !== 1 ? "s" : ""} — click to view`}
                        onClick={(e) => { e.stopPropagation(); setCoursePopup(s.id); }}
                      >
                        <BookOpen size={12} />
                        {courses.length}
                      </button>
                    )}
                    <div className="cm-row-actions" style={{ padding: "0 12px", flexShrink: 0 }}>
                      <button
                        className="cm-icon-button"
                        aria-label={"Edit " + s.name}
                        title="Edit skill"
                        onClick={() => {
                          setOpenSkill(s.id);
                          setEditingSkill(isEditing ? null : s.id);
                        }}
                      >
                        {isEditing ? <X size={15} /> : <Pencil size={15} />}
                      </button>
                      <button
                        className="cm-icon-button danger"
                        aria-label={"Delete " + s.name}
                        disabled={used(data, "skills", s.id)}
                        title={used(data, "skills", s.id) ? "Used by learners or courses" : "Delete skill"}
                        onClick={() => setDeleting({ kind: "skills", item: s })}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isOpen && (
                    <div className="cm-skill-accordion-body">
                      {isEditing ? (
                        <SkillInlineEdit
                          skill={s}
                          data={data}
                          onSave={saveSkill}
                          onCancel={() => setEditingSkill(null)}
                        />
                      ) : (
                        <>
                          {/* Proficiency levels tree */}
                          {definedLevels.length > 0 ? (
                            <div className="cm-accordion-section">
                              <span className="cm-accordion-section-label">Proficiency levels</span>
                              <div className="cm-level-tree">
                                {definedLevels.map((l, i) => (
                                  <div key={l.id} className={"cm-level-node" + (i === definedLevels.length - 1 ? " last" : "")}>
                                    <div className="cm-level-num-badge">{i + 1}</div>
                                    <div className="cm-level-node-content">
                                      <strong>{l.name}</strong>
                                      <p>{s.levels?.[l.id]}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="cm-hint" style={{ margin: "0 0 14px" }}>
                              No level descriptions added. Click Edit to describe what each level looks like.
                            </p>
                          )}

                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
          <p>Competencies group related skills. Select a competency to view and manage its skills.</p>
        </div>
        <div className="cm-actions">
          <button className="cm-button" onClick={() => setUploading(true)}>
            <Upload size={16} /> Bulk upload
          </button>
          <button className="cm-button primary" onClick={() => setCreating(true)}>
            <Plus size={16} /> Create competency
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
          <button className="cm-text-button" onClick={() => onQuery("")}>Clear search</button>
        )}
        <select aria-label="Filter library by category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {data.categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select aria-label="Filter competency status" value={status} onChange={(e) => setStatus(e.target.value)}>
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
          <Download size={16} /> Export CSV
        </button>
        <button className="cm-text-button" onClick={onSettings}>
          <Settings2 size={15} /> Library settings
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
                {visible.slice((current - 1) * 10, current * 10).map((c) => {
                  const children = data.skills.filter((s) => s.competencyId === c.id);
                  return (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.name}</strong>
                        <small>{c.description || "No description added"}</small>
                      </td>
                      <td>
                        <span className="cm-category">
                          {data.categories.find((x) => x.id === c.categoryId)?.name || "Uncategorised"}
                        </span>
                      </td>
                      <td>{children.length} {children.length === 1 ? "skill" : "skills"}</td>
                      <td>
                        <span className={"cm-badge " + c.status.toLowerCase()}>{c.status}</span>
                      </td>
                      <td>
                        <div className="cm-row-actions">
                          <button
                            className="cm-button"
                            onClick={() => { setView({ kind: "skills", cId: c.id }); setOpenSkill(null); setEditingSkill(null); }}
                          >
                            <Layers size={14} /> View skills
                          </button>
                          <button
                            className="cm-icon-button"
                            aria-label={"Edit " + c.name}
                            onClick={() => setEditingComp(c)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="cm-icon-button danger"
                            aria-label={"Delete " + c.name}
                            disabled={used(data, "competencies", c.id)}
                            title={used(data, "competencies", c.id) ? "Contains skills; remove unused skills first" : "Delete competency"}
                            onClick={() => setDeleting({ kind: "competencies", item: c })}
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
            <span>{visible.length} competencies found</span>
            <div>
              <button className="cm-button" disabled={current === 1} onClick={() => setPage(current - 1)}>Previous</button>
              <span>Page {current} of {pages}</span>
              <button className="cm-button" disabled={current === pages} onClick={() => setPage(current + 1)}>Next</button>
            </div>
          </footer>
        </>
      ) : (
        <div className="cm-empty">
          <Search size={26} />
          <h3>No matching competencies or skills</h3>
          <p>Try another name or clear the filters.</p>
          <button className="cm-button" onClick={() => { onQuery(""); setCategory(""); setStatus(""); }}>
            Clear filters
          </button>
        </div>
      )}
      {sharedModals}
    </section>
  );
}
