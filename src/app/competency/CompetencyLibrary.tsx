import { useState, useEffect } from "react";
import {
  Target,
  Plus,
  Upload,
  Download,
  Search,
  Pencil,
  Trash2,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
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
  work,
  onSaveWork,
}: {
  skill: RecordItem;
  data: Data;
  onSave: (item: RecordItem) => void;
  onCancel: () => void;
  work?: WorkflowData;
  onSaveWork?: (work: WorkflowData, msg: string) => boolean;
}) {
  const [draft, setDraft] = useState<RecordItem>(structuredClone(skill));
  const [errors, setErrors] = useState<string[]>([]);
  const levels = data.levels.filter((l) => l.status === "Active");
  const allCourses = work?.courses ?? [];

  const [levelMappings, setLevelMappings] = useState<Record<string, string[]>>(() => {
    const maps: Record<string, string[]> = {};
    for (const course of (work?.courses ?? [])) {
      for (const m of course.mappings) {
        if (m.skillId !== skill.id) continue;
        if (!maps[m.levelId]) maps[m.levelId] = [];
        maps[m.levelId].push(course.id);
      }
    }
    return maps;
  });
  const [levelWeightages, setLevelWeightages] = useState<Record<string, Record<string, number>>>(() => {
    const weights: Record<string, Record<string, number>> = {};
    for (const course of (work?.courses ?? [])) {
      for (const m of course.mappings) {
        if (m.skillId !== skill.id || m.weightage == null) continue;
        if (!weights[m.levelId]) weights[m.levelId] = {};
        weights[m.levelId][course.id] = m.weightage;
      }
    }
    return weights;
  });
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const [pickerLevelId, setPickerLevelId] = useState<string | null>(null);
  const [pickerDraft, setPickerDraft] = useState<string[]>([]);
  const [pickerOriginal, setPickerOriginal] = useState<string[]>([]);
  const [pickerWeightages, setPickerWeightages] = useState<Record<string, number>>({});
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerShowSelected, setPickerShowSelected] = useState(false);

  function getLevelCourses(levelId: string): Course[] {
    return (levelMappings[levelId] ?? [])
      .map((id) => allCourses.find((c) => c.id === id))
      .filter((c): c is Course => c != null);
  }

  function openPicker(levelId: string) {
    const existing = [...(levelMappings[levelId] ?? [])];
    setPickerDraft(existing);
    setPickerOriginal(existing);
    setPickerWeightages(levelWeightages[levelId] ?? {});
    setPickerSearch(""); setPickerShowSelected(false);
    setPickerLevelId(levelId);
  }

  function applyPicker() {
    if (!pickerLevelId) return;
    setLevelMappings((prev) => ({ ...prev, [pickerLevelId]: pickerDraft }));
    setLevelWeightages((prev) => ({
      ...prev,
      [pickerLevelId]: Object.fromEntries(pickerDraft.map((id) => [id, pickerWeightages[id] ?? 0])),
    }));
    setPickerLevelId(null);
  }

  function save() {
    const errs = validate(draft, "skills", data).filter(
      (e) => e !== "Choose an active category." && e !== "Choose an active competency in this category.",
    );
    if (errs.length) { setErrors(errs); return; }
    const saved = { ...draft, name: draft.name.trim(), description: draft.description.trim() };
    if (onSaveWork && work) {
      const updatedCourses = work.courses.map((course) => {
        const others = course.mappings.filter((m) => m.skillId !== saved.id);
        const newMaps: { skillId: string; levelId: string; weightage?: number }[] = [];
        for (const [levelId, ids] of Object.entries(levelMappings)) {
          if (ids.includes(course.id))
            newMaps.push({ skillId: saved.id, levelId, weightage: levelWeightages[levelId]?.[course.id] });
        }
        const combined = [...others, ...newMaps];
        return combined.length !== course.mappings.length ? { ...course, mappings: combined } : course;
      });
      if (updatedCourses.some((c, i) => c !== work.courses[i]))
        onSaveWork({ ...work, courses: updatedCourses }, `Updated course mappings for "${saved.name}"`);
    }
    onSave(saved);
  }

  // Picker dialog — early return
  if (pickerLevelId) {
    const levelName = levels.find((l) => l.id === pickerLevelId)?.name ?? pickerLevelId;
    const pickerFiltered = allCourses.filter((c) => {
      if (pickerShowSelected && !pickerDraft.includes(c.id)) return false;
      return !pickerSearch || c.name.toLowerCase().includes(pickerSearch.toLowerCase());
    });
    const hasChanged =
      pickerDraft.length !== pickerOriginal.length ||
      pickerDraft.some((id) => !pickerOriginal.includes(id)) ||
      pickerOriginal.some((id) => !pickerDraft.includes(id));
    return (
      <Dialog open onOpenChange={(open) => { if (!open) setPickerLevelId(null); }}>
        <DialogContent className="cm-dialog cm-picker-dialog">
          <DialogHeader className="cm-picker-header">
            <DialogTitle>Map courses</DialogTitle>
            <DialogDescription>{draft.name.trim() || "New skill"} · {levelName}</DialogDescription>
            <p className="cm-picker-hint">Select courses to support this proficiency level.</p>
          </DialogHeader>
          <div className="cm-picker-controls">
            <div className="cm-picker-search">
              <Search size={15} className="cm-picker-search-icon" />
              <input autoFocus type="text" placeholder="Search courses…" value={pickerSearch} onChange={(e) => setPickerSearch(e.target.value)} />
              {pickerSearch && <button type="button" className="cm-picker-clear-btn" onClick={() => setPickerSearch("")} aria-label="Clear search"><X size={13} /></button>}
            </div>
            <div className="cm-picker-filter-row">
              <button type="button" className={`cm-picker-filter-btn${!pickerShowSelected ? " active" : ""}`} onClick={() => setPickerShowSelected(false)}>All courses ({allCourses.length})</button>
              <button type="button" className={`cm-picker-filter-btn${pickerShowSelected ? " active" : ""}`} onClick={() => setPickerShowSelected(true)}>Selected ({pickerDraft.length})</button>
            </div>
          </div>
          <div className="cm-picker-list" role="list">
            {pickerFiltered.length === 0 && (
              <p className="cm-picker-empty">{pickerShowSelected ? "No courses selected yet." : pickerSearch ? `No results for "${pickerSearch}".` : "No courses available."}</p>
            )}
            {pickerFiltered.map((course) => {
              const checked = pickerDraft.includes(course.id);
              return (
                <label key={course.id} className={`cm-picker-row${checked ? " checked" : ""}`}>
                  <input type="checkbox" checked={checked} onChange={(e) => {
                    if (e.target.checked) setPickerDraft((d) => [...d, course.id]);
                    else setPickerDraft((d) => d.filter((id) => id !== course.id));
                  }} />
                  <span className="cm-picker-name">{course.name}</span>
                  {checked && (
                    <div className="cm-picker-weight">
                      <input
                        type="number" min={0} max={100}
                        value={pickerWeightages[course.id] ?? ""}
                        placeholder="0"
                        aria-label={`Weightage for ${course.name}`}
                        onClick={(e) => e.preventDefault()}
                        onChange={(e) => {
                          const v = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
                          setPickerWeightages((w) => ({ ...w, [course.id]: v }));
                        }}
                      />
                      <span>%</span>
                    </div>
                  )}
                </label>
              );
            })}
          </div>
          <div className="cm-dialog-actions cm-picker-footer">
            {(() => {
              const total = pickerDraft.reduce((s, id) => s + (pickerWeightages[id] ?? 0), 0);
              const cls = pickerDraft.length === 0 ? "" : total === 100 ? " ok" : total > 100 ? " over" : " warn";
              return (
                <span className={`cm-picker-count${cls}`}>
                  {pickerDraft.length === 0
                    ? "None selected"
                    : `${pickerDraft.length} course${pickerDraft.length !== 1 ? "s" : ""} · Total: ${total}%`}
                </span>
              );
            })()}
            <button type="button" className="cm-button" onClick={() => setPickerLevelId(null)}>Cancel</button>
            <button type="button" className="cm-button primary" disabled={!hasChanged} onClick={applyPicker}>Apply selection</button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="cm-create-inline">
      {errors.length > 0 && (
        <div className="cm-error" role="alert">
          {errors.map((e) => <div key={e}>{e}</div>)}
        </div>
      )}
      <div className="cm-config-section">
        <div className="cm-create-skill-card-body">
          <label>
            <span className="cm-req-label">Skill name <span className="req">*</span></span>
            <input autoFocus maxLength={120} value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="e.g. Active Listening" />
          </label>
          <label>
            <span>Description <span className="cm-field-optional">optional</span></span>
            <textarea rows={2} value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="What will the learner be able to do?" />
          </label>
          {levels.length > 0 && (
            <div className="cm-proficiency-section">
              <p className="cm-proficiency-label">Proficiency levels</p>
              {levels.map((l) => {
                const expanded = expandedLevels.has(l.id);
                const desc = draft.levels?.[l.id]?.trim() ?? "";
                const mapped = getLevelCourses(l.id);
                return (
                  <div key={l.id} className={`cm-level-row${expanded ? " expanded" : ""}`}>
                    <button type="button" className="cm-level-row-toggle" aria-expanded={expanded}
                      onClick={() => setExpandedLevels((prev) => { const n = new Set(prev); n.has(l.id) ? n.delete(l.id) : n.add(l.id); return n; })}>
                      {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      <span className="cm-level-row-name">{l.name}</span>
                      <span className="cm-level-row-preview">{desc || <em>Description required</em>}</span>
                      <span className="cm-level-row-meta">{mapped.length > 0 ? `${mapped.length} course${mapped.length !== 1 ? "s" : ""}` : ""}</span>
                    </button>
                    {expanded && (
                      <div className="cm-level-row-body">
                        <label>
                          <span className="cm-req-label">Proficiency description <span className="req">*</span></span>
                          <textarea rows={3} aria-label={`${l.name} proficiency description`}
                            value={draft.levels?.[l.id] ?? ""}
                            onChange={(e) => setDraft((d) => ({ ...d, levels: { ...d.levels, [l.id]: e.target.value } }))}
                            placeholder={`What can someone do at ${l.name.toLowerCase()} level?`} />
                        </label>
                        <div className="cm-level-courses">
                          <div className="cm-level-courses-hd">
                            <span>Mapped courses ({mapped.length})</span>
                            <button type="button" className="cm-map-courses-btn" onClick={() => openPicker(l.id)}>
                              <Plus size={11} /> Map courses
                            </button>
                          </div>
                          {mapped.length === 0 ? (
                            <p className="cm-level-no-courses">No courses mapped.</p>
                          ) : (() => {
                            const total = mapped.reduce((sum, c) => sum + (levelWeightages[l.id]?.[c.id] ?? 0), 0);
                            const cls = total === 100 ? "ok" : total > 100 ? "over" : "warn";
                            return (
                              <>
                                <div className="cm-course-list">
                                  {mapped.map((c) => {
                                    const w = levelWeightages[l.id]?.[c.id];
                                    return (
                                      <div key={c.id} className="cm-course-row">
                                        <span className="cm-course-row-name">{c.name}</span>
                                        <div className="cm-course-row-weight">
                                          <input
                                            type="number" min={0} max={100}
                                            value={w ?? ""} placeholder="0"
                                            aria-label={`Weightage for ${c.name}`}
                                            onChange={(e) => {
                                              const v = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
                                              setLevelWeightages((prev) => ({ ...prev, [l.id]: { ...prev[l.id], [c.id]: v } }));
                                            }}
                                          />
                                          <span>%</span>
                                        </div>
                                        <button type="button" aria-label={`Remove ${c.name}`} className="cm-course-row-remove"
                                          onClick={() => setLevelMappings((prev) => ({ ...prev, [l.id]: (prev[l.id] ?? []).filter((id) => id !== c.id) }))}>
                                          <X size={12} />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                                <p className={`cm-course-total ${cls}`}>Total: {total}%</p>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="cm-inline-form-actions" style={{ borderTop: "none", paddingTop: 0 }}>
            <button type="button" className="cm-button" onClick={onCancel}>Cancel</button>
            <button type="button" className="cm-button primary" onClick={save}>Save skill</button>
          </div>
        </div>
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
  const [editingCompInline, setEditingCompInline] = useState<RecordItem | null>(null);
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

  /* Early return: inline edit form */
  if (editingCompInline) {
    const existingSkills = data.skills.filter((s) => s.competencyId === editingCompInline.id);
    return (
      <LibraryCreate
        data={data}
        onSaveWork={onSaveWork}
        initial={{ competency: editingCompInline, skills: existingSkills }}
        onClose={() => setEditingCompInline(null)}
        onSave={(updatedComp, updatedSkills) => {
          const otherSkills = data.skills.filter((s) => s.competencyId !== updatedComp.id);
          if (
            commit(
              {
                ...data,
                competencies: data.competencies.map((c) => (c.id === updatedComp.id ? updatedComp : c)),
                skills: [...otherSkills, ...updatedSkills],
              },
              `Saved "${updatedComp.name}"`,
            )
          )
            setEditingCompInline(null);
        }}
      />
    );
  }

  /* Early return: inline create form */
  if (creating) {
    return (
      <LibraryCreate
        data={data}
        onSaveWork={onSaveWork}
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
    );
  }

  /* shared modals */
  const sharedModals = (
    <>
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
              <button className="cm-button" onClick={() => setDeleting(null)}>Cancel</button>
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
                Delete
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
            <button className="cm-icon-button" aria-label={"Edit " + comp.name} onClick={() => setEditingCompInline(comp)}>
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
          <SkillInlineEdit
            skill={{ id: uid(), name: "", description: "", status: "Active", levels: {}, competencyId: comp.id }}
            data={data}
            work={work}
            onSaveWork={onSaveWork}
            onSave={(item) => {
              if (commit({ ...data, skills: [...data.skills, item] }, `Added skill "${item.name}"`))
                setEditingSkill(null);
            }}
            onCancel={() => setEditingSkill(null)}
          />
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
                        <span className="cm-table-link">{s.name}</span>
                        {s.description && <small>{s.description}</small>}
                      </span>
                      <span className="cm-skill-accordion-meta">
                        <span className="cm-category">
                          {definedLevels.length} {definedLevels.length === 1 ? "level" : "levels"}
                        </span>
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
                          work={work}
                          onSaveWork={onSaveWork}
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
          style={{ marginLeft: "auto" }}
          onClick={() =>
            download("competencies-and-skills.csv", [
              libraryHeaders(data),
              ...libraryRows(data, visible),
            ])
          }
        >
          <Download size={16} /> Export CSV
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
                      <td>
                        <button
                          className="cm-table-link"
                          onClick={() => { setView({ kind: "skills", cId: c.id }); setOpenSkill(null); setEditingSkill(null); }}
                        >
                          {children.length} {children.length === 1 ? "skill" : "skills"}
                        </button>
                      </td>
                      <td>
                        <span className={"cm-badge " + c.status.toLowerCase()}>{c.status}</span>
                      </td>
                      <td>
                        <div className="cm-row-actions">
                          <button
                            className="cm-icon-button"
                            aria-label={"Edit " + c.name}
                            onClick={() => setEditingCompInline(c)}
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
