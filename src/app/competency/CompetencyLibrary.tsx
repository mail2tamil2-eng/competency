import { useState, useEffect } from "react";
import {
  Check,
  Target,
  Plus,
  Upload,
  Download,
  Search,
  Pencil,
  Trash2,
  Ban,
  CheckCircle2,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  BookOpen,
  X,
} from "lucide-react";
import { Data, RecordItem, Kind, used, download, uid, validate, inComp, compIdsOf, withComps, compSkills, compSkillLevels } from "./model";
import { WorkflowData, Course } from "./workflowModel";
import { LibraryCreate } from "./LibraryCreate";
import { DisclosureIcon } from "./Disclosure";
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
export function SkillInlineEdit({
  skill,
  data,
  onSave,
  onCancel,
  work,
  onSaveWork,
  showMandatory = true,
  requireCourse = false,
}: {
  skill: RecordItem;
  data: Data;
  /** nextWork carries updated course mappings so the caller saves skill and courses in one commit. */
  onSave: (item: RecordItem, nextWork?: WorkflowData) => void;
  onCancel: () => void;
  work?: WorkflowData;
  onSaveWork?: (work: WorkflowData, msg: string) => boolean;
  /** Skill Master hides the per-course Mandatory option; competency screens keep it. */
  showMandatory?: boolean;
  /** Skill Master: at least one course must be mapped to some level. */
  requireCourse?: boolean;
}) {
  const [draft, setDraft] = useState<RecordItem>(structuredClone(skill));
  const [errors, setErrors] = useState<string[]>([]);
  const [triedSave, setTriedSave] = useState(false);
  const allLevels = data.levels.filter((l) => l.status === "Active").sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  // Levels run in order from the first level up to the highest one chosen (all by default).
  const topIndex = draft.levelIds
    ? Math.max(0, ...allLevels.map((l, i) => (draft.levelIds!.includes(l.id) ? i : -1)))
    : allLevels.length - 1;
  const levels = allLevels.slice(0, topIndex + 1);
  function chooseTopLevel(id: string) {
    const idx = allLevels.findIndex((l) => l.id === id);
    const next = allLevels.slice(0, idx + 1).map((l) => l.id);
    setDraft((d) => ({ ...d, levelIds: next.length === allLevels.length ? undefined : next }));
  }
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
  const [levelRequirements, setLevelRequirements] = useState<Record<string, Record<string, boolean>>>(() => {
    const weights: Record<string, Record<string, boolean>> = {};
    for (const course of (work?.courses ?? [])) {
      for (const m of course.mappings) {
        if (m.skillId !== skill.id || m.mandatory == null) continue;
        if (!weights[m.levelId]) weights[m.levelId] = {};
        weights[m.levelId][course.id] = m.mandatory;
      }
    }
    return weights;
  });
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const [pickerLevelId, setPickerLevelId] = useState<string | null>(null);
  const [pickerDraft, setPickerDraft] = useState<string[]>([]);
  const [pickerOriginal, setPickerOriginal] = useState<string[]>([]);
  const [pickerRequirements, setPickerRequirements] = useState<Record<string, boolean>>({});
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
    setPickerRequirements(levelRequirements[levelId] ?? {});
    setPickerSearch(""); setPickerShowSelected(false);
    setPickerLevelId(levelId);
  }

  function applyPicker() {
    if (!pickerLevelId) return;
    setLevelMappings((prev) => ({ ...prev, [pickerLevelId]: pickerDraft }));
    setLevelRequirements((prev) => ({
      ...prev,
      [pickerLevelId]: Object.fromEntries(pickerDraft.map((id) => [id, pickerRequirements[id] ?? true])),
    }));
    setPickerLevelId(null);
  }

  function save() {
    const errs = validate(draft, "skills", data).filter(
      (e) => e !== "Choose an active competency.",
    );
    setTriedSave(true);
    if (!levels.length) errs.push("Choose at least one proficiency level for this skill.");
    // Skill Master: every active proficiency level needs at least one course.
    const levelsWithoutCourse = requireCourse ? levels.filter((l) => !(levelMappings[l.id]?.length)) : [];
    if (levelsWithoutCourse.length)
      errs.push(`Map at least one course to each proficiency level. Missing: ${levelsWithoutCourse.map((l) => l.name).join(", ")}.`);
    if (errs.length) { setErrors(errs); return; }
    const keep = new Set(levels.map((l) => l.id));
    const saved: RecordItem = {
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
      // Drop descriptions for levels the skill no longer uses.
      levels: Object.fromEntries(Object.entries(draft.levels ?? {}).filter(([id]) => keep.has(id))),
      levelIds: levels.length === allLevels.length ? undefined : levels.map((l) => l.id),
    };
    let nextWork: WorkflowData | undefined;
    if (work) {
      const updatedCourses = work.courses.map((course) => {
        const others = course.mappings.filter((m) => m.skillId !== saved.id);
        const newMaps: { skillId: string; levelId: string; mandatory?: boolean }[] = [];
        for (const [levelId, ids] of Object.entries(levelMappings)) {
          if (keep.has(levelId) && ids.includes(course.id))
            newMaps.push({ skillId: saved.id, levelId, mandatory: levelRequirements[levelId]?.[course.id] });
        }
        const combined = [...others, ...newMaps];
        return JSON.stringify(combined) !== JSON.stringify(course.mappings) ? { ...course, mappings: combined } : course;
      });
      if (updatedCourses.some((c, i) => c !== work.courses[i]))
        nextWork = { ...work, courses: updatedCourses };
    }
    // Saving the skill and its course mappings separately let the second save overwrite the first.
    onSave(saved, nextWork);
  }

  // Picker dialog — early return
  if (pickerLevelId) {
    const levelName = allLevels.find((l) => l.id === pickerLevelId)?.name ?? pickerLevelId;
    const pickerFiltered = allCourses.filter((c) => {
      if (pickerShowSelected && !pickerDraft.includes(c.id)) return false;
      return !pickerSearch || c.name.toLowerCase().includes(pickerSearch.toLowerCase());
    });
    const hasChanged =
      pickerDraft.length !== pickerOriginal.length ||
      pickerDraft.some((id) => !pickerOriginal.includes(id)) ||
      pickerOriginal.some((id) => !pickerDraft.includes(id)) ||
      pickerDraft.some((id) => (pickerRequirements[id] ?? true) !== (levelRequirements[pickerLevelId]?.[id] ?? true));
    return (
      <Dialog open onOpenChange={(open) => { if (!open) setPickerLevelId(null); }}>
        <DialogContent className="cm-dialog cm-picker-dialog">
          <DialogHeader className="cm-picker-header">
            <DialogTitle>Map Courses</DialogTitle>
            <DialogDescription>{draft.name.trim() || "New skill"} · {levelName}</DialogDescription>
            <p className="cm-picker-hint">{showMandatory ? "Select courses for this proficiency level. Mark courses as mandatory when completion is required." : "Select courses for this proficiency level."}</p>
          </DialogHeader>
          <div className="cm-picker-controls">
            <div className="cm-picker-search">
              <Search size={15} className="cm-picker-search-icon" />
              <input autoFocus type="text" placeholder="Search courses…" value={pickerSearch} onChange={(e) => setPickerSearch(e.target.value)} />
              {pickerSearch && <button type="button" className="cm-picker-clear-btn" onClick={() => setPickerSearch("")} aria-label="Clear Search"><X size={13} /></button>}
            </div>
            <div className="cm-picker-filter-row">
              <button type="button" className={`cm-picker-filter-btn${!pickerShowSelected ? " active" : ""}`} onClick={() => setPickerShowSelected(false)}>All Courses ({allCourses.length})</button>
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
                <div role="listitem" key={course.id} className={`cm-picker-row${checked ? " checked" : ""}`}>
                  <input type="checkbox" checked={checked} aria-label={`Select ${course.name}`} onChange={(e) => {
                    if (e.target.checked) setPickerDraft((d) => [...d, course.id]);
                    else setPickerDraft((d) => d.filter((id) => id !== course.id));
                  }} />
                  <span className="cm-picker-name">{course.name}</span>
                  {showMandatory && <label className="cm-course-mandatory"><input type="checkbox" disabled={!checked} checked={checked && (pickerRequirements[course.id] ?? true)} aria-label={`Mandatory for ${course.name}`} onChange={(e) => setPickerRequirements((prev) => ({ ...prev, [course.id]: e.target.checked }))} /><span>Mandatory</span></label>}
                </div>
              );
            })}
          </div>
          <div className="cm-dialog-actions cm-picker-footer">
            <span className="cm-picker-count">{pickerDraft.length} Selected</span>
            <button type="button" className="cm-button" onClick={() => setPickerLevelId(null)}>Cancel</button>
            <button type="button" className="cm-button primary" disabled={!hasChanged} onClick={applyPicker}>Apply Selection</button>
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
            <span className="cm-req-label">Skill Name <span className="req">*</span></span>
            <input autoFocus maxLength={120} value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="e.g. Active Listening" />
          </label>
          <label>
            <span>Description <span className="cm-field-optional">Optional</span></span>
            <textarea rows={2} value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="What will the learner be able to do?" />
          </label>
          {allLevels.length > 0 && (
            <div className="cm-proficiency-section">
              <p className="cm-proficiency-label">
                Proficiency levels
                {requireCourse && <span className="cm-proficiency-req"> · Each chosen level needs at least one course <span className="req">*</span></span>}
              </p>
              <div className="cm-level-picker" role="radiogroup" aria-label="Highest level for this skill">
                <span className="cm-level-picker-label">Highest level for this skill</span>
                {allLevels.map((l, i) => {
                  const on = i <= topIndex;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      role="radio"
                      aria-checked={i === topIndex}
                      className={"cm-level-chip" + (on ? " on" : "") + (i === topIndex ? " top" : "")}
                      title={i === 0 ? `Use ${l.name} only` : `Use ${allLevels[0].name} to ${l.name}`}
                      onClick={() => chooseTopLevel(l.id)}
                    >
                      {on ? <Check size={13} /> : <Plus size={13} />} {l.name}
                    </button>
                  );
                })}
                <span className="cm-level-picker-count">{levels.length} of {allLevels.length}</span>
              </div>
              {levels.map((l) => {
                const expanded = expandedLevels.has(l.id);
                const desc = draft.levels?.[l.id]?.trim() ?? "";
                const mapped = getLevelCourses(l.id);
                return (
                  <div key={l.id} className={`cm-level-row${expanded ? " expanded" : ""}`}>
                    <button type="button" className="cm-level-row-toggle" aria-expanded={expanded}
                      onClick={() => setExpandedLevels((prev) => { const n = new Set(prev); n.has(l.id) ? n.delete(l.id) : n.add(l.id); return n; })}>
                      <DisclosureIcon open={expanded} />
                      <span className="cm-level-row-name">{l.name}</span>
                      <span className="cm-level-row-preview">{desc || <em>No description</em>}</span>
                      <span className="cm-level-row-meta">
                        {mapped.length > 0
                          ? `${mapped.length} course${mapped.length !== 1 ? "s" : ""}`
                          : requireCourse && triedSave
                            ? <span className="cm-level-course-required">Course required</span>
                            : ""}
                      </span>
                    </button>
                    {expanded && (
                      <div className="cm-level-row-body">
                        <label>
                          <span className="cm-req-label">Proficiency Description</span>
                          <textarea rows={3} aria-label={`${l.name} proficiency description`}
                            value={draft.levels?.[l.id] ?? ""}
                            onChange={(e) => setDraft((d) => ({ ...d, levels: { ...d.levels, [l.id]: e.target.value } }))}
                            placeholder={`What can someone do at ${l.name.toLowerCase()} level?`} />
                        </label>
                        <div className="cm-level-courses">
                          <div className="cm-level-courses-hd">
                            <span>Mapped Courses ({mapped.length}){requireCourse && <span className="req"> *</span>}</span>
                          </div>
                          {mapped.length === 0 ? (
                            /* Empty state: the action sits where the eye lands, not in a corner */
                            <div className={"cm-courses-empty" + (requireCourse && triedSave ? " is-required" : "")}>
                              <BookOpen size={20} />
                              <p>
                                <strong>No courses mapped yet</strong>
                                <span>{requireCourse ? `Add at least one course learners take to reach ${l.name}.` : `Add courses learners take to reach ${l.name}.`}</span>
                              </p>
                              <button type="button" className="cm-button primary cm-button-sm" onClick={() => openPicker(l.id)}>
                                <Plus size={15} /> Map Courses
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="cm-course-list">
                                {mapped.map((c) => {
                                  const w = levelRequirements[l.id]?.[c.id];
                                  return (
                                    <div key={c.id} className="cm-course-row">
                                      <span className="cm-course-row-name">{c.name}</span>
                                      {showMandatory && <label className="cm-course-mandatory"><input type="checkbox" checked={w ?? true} aria-label={`Mandatory for ${c.name}`} onChange={(e) => setLevelRequirements((prev) => ({ ...prev, [l.id]: { ...prev[l.id], [c.id]: e.target.checked } }))} /><span>Mandatory</span></label>}
                                      <button type="button" aria-label={`Remove ${c.name}`} className="cm-course-row-remove"
                                        onClick={() => setLevelMappings((prev) => ({ ...prev, [l.id]: (prev[l.id] ?? []).filter((id) => id !== c.id) }))}>
                                        <X size={12} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                              <button type="button" className="cm-button cm-button-sm cm-add-courses-btn" onClick={() => openPicker(l.id)}>
                                <Plus size={15} /> Add Courses
                              </button>
                            </>
                          )}
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
            <button type="button" className="cm-button primary" onClick={save}>Save Skill</button>
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
  courses: { course: Course; mapping: { skillId: string; levelId: string; mandatory?: boolean } }[];
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
      mandatory: mapping.mandatory ?? true,
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
              ? { ...m, mandatory: edit.mandatory }
              : m,
          ),
        };
      }),
    };
    if (onSaveWork(updated, "Course requirements saved")) onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="cm-dialog">
        <DialogHeader>
          <DialogTitle>Mapped Courses</DialogTitle>
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
                  <th>Mandatory</th>
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
                      <input type="checkbox" aria-label={`Mandatory for ${course.name}`} checked={edits[i].mandatory} onChange={(e) => setEdits(edits.map((ed, idx) => idx === i ? { ...ed, mandatory: e.target.checked } : ed))} />
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
  const [levelCourseView, setLevelCourseView] = useState<{ skillId: string; levelId: string } | null>(null);
  const [inactivatingSkill, setInactivatingSkill] = useState<RecordItem | null>(null);
  const [inactivatingComp, setInactivatingComp] = useState<RecordItem | null>(null);
  const [levelPicker, setLevelPicker] = useState<{ skillId: string; levelId: string } | null>(null);
  const [lPickerDraft, setLPickerDraft] = useState<string[]>([]);
  const [lPickerOriginal, setLPickerOriginal] = useState<string[]>([]);
  const [lPickerRequirements, setLPickerRequirements] = useState<Record<string, boolean>>({});
  const [lPickerSearch, setLPickerSearch] = useState("");
  const [lPickerShowSelected, setLPickerShowSelected] = useState(false);

  useEffect(() => {
    if (intent?.action === "create") setCreating(true);
    if (intent?.action === "search") {
      setStatus(""); setPage(1);
      setView({ kind: "list" });
    }
    if (intent?.action === "open" && intent.id)
      setView({ kind: "skills", cId: intent.id });
  }, [intent]);

  useEffect(() => setPage(1), [query, status]);

  const term = query.trim().toLowerCase();
  const matches = (r: RecordItem) =>
    (r.name + " " + r.description).toLowerCase().includes(term);

  const visible = data.competencies.filter(
    (c) =>
      (!status || c.status === status) &&
      (!term || matches(c) || data.skills.some((s) => inComp(s, c.id) && matches(s))),
  );
  const pages = Math.max(1, Math.ceil(visible.length / 10));
  const current = Math.min(page, pages);

  const levelName = (lId: string) =>
    data.levels.find((l) => l.id === lId)?.name || lId;
  const coursesForSkill = (sId: string) =>
    (work?.courses ?? []).filter((c) => c.mappings.some((m) => m.skillId === sId));

  const skillIsProtected = (sId: string) =>
    used(data, "skills", sId) || (work?.courses ?? []).some((c) => c.mappings.some((m) => m.skillId === sId));

  const compIsProtected = (cId: string) =>
    data.skills.some((s) => inComp(s, cId));

  function openLevelPicker(skillId: string, levelId: string) {
    if (!work) return;
    const ids = work.courses
      .filter((c) => c.mappings.some((m) => m.skillId === skillId && m.levelId === levelId))
      .map((c) => c.id);
    const weights: Record<string, boolean> = {};
    work.courses.forEach((c) => {
      const m = c.mappings.find((m) => m.skillId === skillId && m.levelId === levelId);
      if (m?.mandatory != null) weights[c.id] = m.mandatory;
    });
    setLPickerDraft(ids);
    setLPickerOriginal(ids);
    setLPickerRequirements(weights);
    setLPickerSearch("");
    setLPickerShowSelected(false);
    setLevelPicker({ skillId, levelId });
  }

  function applyLevelPicker() {
    if (!levelPicker || !work || !onSaveWork) return;
    const { skillId, levelId } = levelPicker;
    const updatedCourses = work.courses.map((course) => {
      const others = course.mappings.filter(
        (m) => !(m.skillId === skillId && m.levelId === levelId),
      );
      if (lPickerDraft.includes(course.id)) {
        return {
          ...course,
          mappings: [...others, { skillId, levelId, mandatory: lPickerRequirements[course.id] ?? true }],
        };
      }
      return others.length !== course.mappings.length ? { ...course, mappings: others } : course;
    });
    if (onSaveWork({ ...work, courses: updatedCourses }, "Course mappings updated"))
      setLevelPicker(null);
  }

  function saveSkill(item: RecordItem, nextWork?: WorkflowData) {
    const list = data.skills;
    if (
      commit(
        { ...data, skills: list.map((x) => (x.id === item.id ? item : x)), ...(nextWork ? { workflow: nextWork } : {}) },
        "Skill saved",
      )
    )
      setEditingSkill(null);
  }

  /* Early return: inline edit form */
  if (editingCompInline) {
    const existingSkills = compSkills(data, editingCompInline.id);
    return (
      <LibraryCreate
        data={data}
        work={work}
        onSaveWork={onSaveWork}
        initial={{ competency: editingCompInline, skills: existingSkills }}
        onClose={() => setEditingCompInline(null)}
        onSave={(updatedComp, updatedSkills) => {
          // Unlink skills removed from this competency; they stay in any other competencies.
          const skills = data.skills.map((s) => {
            const updated = updatedSkills.find((u) => u.id === s.id);
            if (updated) return updated;
            return inComp(s, updatedComp.id) ? withComps(s, compIdsOf(s).filter((id) => id !== updatedComp.id)) : s;
          });
          if (
            commit(
              {
                ...data,
                competencies: data.competencies.map((c) => (c.id === updatedComp.id ? updatedComp : c)),
                skills,
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
        work={work}
        onSaveWork={onSaveWork}
        onClose={() => setCreating(false)}
        onSave={(competency, skills) => {
          const linked = data.skills.map((s) => skills.find((u) => u.id === s.id) ?? s);
          if (
            commit(
              {
                ...data,
                competencies: [...data.competencies, competency],
                skills: linked,
              },
              `Created "${competency.name}" with ${skills.length} ${skills.length === 1 ? "skill" : "skills"}`,
            )
          )
            setCreating(false);
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
              onQuery(""); setStatus(""); setPage(1);
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
      {deleting && deleting.kind === "skills" && view.kind === "skills" && compIdsOf(deleting.item).length > 1 && (() => {
        /* Shared skill: remove it from this competency only. */
        const cId = view.cId;
        const compName = data.competencies.find((c) => c.id === cId)?.name ?? "this competency";
        const others = compIdsOf(deleting.item).filter((id) => id !== cId)
          .map((id) => data.competencies.find((c) => c.id === id)?.name).filter(Boolean) as string[];
        return (
          <Dialog open onOpenChange={(open) => { if (!open) setDeleting(null); }}>
            <DialogContent className="cm-dialog">
              <DialogHeader>
                <DialogTitle>Are you sure you want to remove {deleting.item.name} from {compName}?</DialogTitle>
                <DialogDescription>
                  The skill stays in {others.join(", ")} and in Skill Master. Learner progress is not affected.
                </DialogDescription>
              </DialogHeader>
              <div className="cm-dialog-actions">
                <button className="cm-button" onClick={() => setDeleting(null)}>Cancel</button>
                <button
                  className="cm-button destructive"
                  onClick={() => {
                    const skills = data.skills.map((x) => x.id === deleting.item.id ? withComps(x, compIdsOf(x).filter((id) => id !== cId)) : x);
                    if (commit({ ...data, skills }, `${deleting.item.name} removed from ${compName}`)) setDeleting(null);
                  }}
                >
                  Remove
                </button>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
      {deleting && !(deleting.kind === "skills" && view.kind === "skills" && compIdsOf(deleting.item).length > 1) && (
        <Dialog open onOpenChange={(open) => { if (!open) setDeleting(null); }}>
          <DialogContent className="cm-dialog">
            <DialogHeader>
              <DialogTitle>
                {deleting.kind === "skills"
                  ? skillIsProtected(deleting.item.id)
                    ? `${deleting.item.name} is mapped to courses or acquired by users, so cannot be deleted.`
                    : `Are you sure you want to delete ${deleting.item.name}?`
                  : compIsProtected(deleting.item.id)
                    ? `${deleting.item.name} is mapped to a skill and cannot be deleted.`
                    : `Are you sure you want to delete ${deleting.item.name}?`}
              </DialogTitle>
              <DialogDescription />
            </DialogHeader>
            <div className="cm-dialog-actions">
              <button className="cm-button" onClick={() => setDeleting(null)}>Cancel</button>
              {!(deleting.kind === "skills" ? skillIsProtected(deleting.item.id) : compIsProtected(deleting.item.id)) && (
                <button
                  className="cm-button destructive"
                  onClick={() => {
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
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      {inactivatingComp && (
        <Dialog open onOpenChange={(open) => { if (!open) setInactivatingComp(null); }}>
          <DialogContent className="cm-dialog">
            <DialogHeader>
              <DialogTitle>
                {compIsProtected(inactivatingComp.id)
                  ? `${inactivatingComp.name} is mapped to a skill and cannot be inactivated.`
                  : `Are you sure you want to inactivate ${inactivatingComp.name}?`}
              </DialogTitle>
              <DialogDescription />
            </DialogHeader>
            <div className="cm-dialog-actions">
              <button className="cm-button" onClick={() => setInactivatingComp(null)}>Cancel</button>
              {!compIsProtected(inactivatingComp.id) && (
                <button
                  className="cm-button destructive"
                  onClick={() => {
                    if (
                      commit(
                        { ...data, competencies: data.competencies.map((x) => x.id === inactivatingComp.id ? { ...x, status: "Inactive" as const } : x) },
                        `${inactivatingComp.name} inactivated`,
                      )
                    )
                      setInactivatingComp(null);
                  }}
                >
                  Inactivate
                </button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      {inactivatingSkill && (
        <Dialog open onOpenChange={(open) => { if (!open) setInactivatingSkill(null); }}>
          <DialogContent className="cm-dialog">
            <DialogHeader>
              <DialogTitle>
                {skillIsProtected(inactivatingSkill.id)
                  ? `${inactivatingSkill.name} is mapped to courses or acquired by users and cannot be inactivated.`
                  : `Are you sure you want to inactivate ${inactivatingSkill.name}?`}
              </DialogTitle>
              <DialogDescription />
            </DialogHeader>
            <div className="cm-dialog-actions">
              <button className="cm-button" onClick={() => setInactivatingSkill(null)}>Cancel</button>
              {!skillIsProtected(inactivatingSkill.id) && (
                <button
                  className="cm-button destructive"
                  onClick={() => {
                    if (
                      commit(
                        { ...data, skills: data.skills.map((x) => x.id === inactivatingSkill.id ? { ...x, status: "Inactive" as const } : x) },
                        `${inactivatingSkill.name} inactivated`,
                      )
                    )
                      setInactivatingSkill(null);
                  }}
                >
                  Inactivate
                </button>
              )}
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
      {levelCourseView && work && (() => {
        const skill = data.skills.find((sk) => sk.id === levelCourseView.skillId);
        const level = data.levels.find((lv) => lv.id === levelCourseView.levelId);
        const mappedCourses = (work.courses ?? [])
          .filter((c) => c.mappings.some((m) => m.skillId === levelCourseView.skillId && m.levelId === levelCourseView.levelId))
          .map((c) => ({
            course: c,
            mapping: c.mappings.find((m) => m.skillId === levelCourseView.skillId && m.levelId === levelCourseView.levelId)!,
          }));
        if (!skill || !level || mappedCourses.length === 0) return null;
        return (
          <Dialog open onOpenChange={(open) => { if (!open) setLevelCourseView(null); }}>
            <DialogContent className="cm-dialog">
              <DialogHeader>
                <DialogTitle>Mapped Courses</DialogTitle>
                <DialogDescription>
                  {skill.name} — {level.name} · {mappedCourses.length} course{mappedCourses.length !== 1 ? "s" : ""}
                </DialogDescription>
              </DialogHeader>
              <div className="cm-course-popup-body">
                <div className="cm-course-popup-scroll">
                  <table className="cm-course-popup-table">
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Mandatory</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mappedCourses.map(({ course, mapping }) => (
                        <tr key={course.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <BookOpen size={13} style={{ color: "#526176", flexShrink: 0 }} />
                              <span>{course.name}</span>
                            </div>
                          </td>
                          <td>{mapping.mandatory ? "Yes" : "No"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="cm-dialog-actions">
                <button className="cm-button primary" onClick={() => setLevelCourseView(null)}>Close</button>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
      {levelPicker && work && onSaveWork && (() => {
        const skill = data.skills.find((sk) => sk.id === levelPicker.skillId);
        const level = data.levels.find((lv) => lv.id === levelPicker.levelId);
        const allCourses = work.courses;
        const subtitle = `${skill?.name ?? ""} · ${level?.name ?? ""}`;
        const hasChanged =
          lPickerDraft.length !== lPickerOriginal.length ||
          lPickerDraft.some((id) => !lPickerOriginal.includes(id)) ||
          lPickerOriginal.some((id) => !lPickerDraft.includes(id)) || lPickerDraft.some((id) => (lPickerRequirements[id] ?? true) !== (work.courses.find((c) => c.id === id)?.mappings.find((m) => m.skillId === levelPicker.skillId && m.levelId === levelPicker.levelId)?.mandatory ?? true));
        const pickerFiltered = allCourses.filter((c) => {
          if (lPickerShowSelected && !lPickerDraft.includes(c.id)) return false;
          return !lPickerSearch || c.name.toLowerCase().includes(lPickerSearch.toLowerCase());
        });
        return (
          <Dialog open onOpenChange={(open) => { if (!open) setLevelPicker(null); }}>
            <DialogContent className="cm-dialog cm-picker-dialog">
              <DialogHeader className="cm-picker-header">
                <DialogTitle>Map Courses</DialogTitle>
                <DialogDescription>{subtitle}</DialogDescription>
                <p className="cm-picker-hint">Select courses for this proficiency level. Mark courses as mandatory when completion is required.</p>
              </DialogHeader>
              <div className="cm-picker-controls">
                <div className="cm-picker-search">
                  <Search size={15} className="cm-picker-search-icon" />
                  <input
                    autoFocus type="text" placeholder="Search courses…"
                    value={lPickerSearch} onChange={(e) => setLPickerSearch(e.target.value)}
                  />
                  {lPickerSearch && (
                    <button type="button" className="cm-picker-clear-btn" onClick={() => setLPickerSearch("")} aria-label="Clear Search">
                      <X size={13} />
                    </button>
                  )}
                </div>
                <div className="cm-picker-filter-row">
                  <button type="button" className={`cm-picker-filter-btn${!lPickerShowSelected ? " active" : ""}`} onClick={() => setLPickerShowSelected(false)}>
                    All Courses ({allCourses.length})
                  </button>
                  <button type="button" className={`cm-picker-filter-btn${lPickerShowSelected ? " active" : ""}`} onClick={() => setLPickerShowSelected(true)}>
                    Selected ({lPickerDraft.length})
                  </button>
                </div>
              </div>
              <div className="cm-picker-list" role="list">
                {pickerFiltered.length === 0 && (
                  <p className="cm-picker-empty">
                    {lPickerShowSelected ? "No courses selected yet." : lPickerSearch ? `No results for "${lPickerSearch}".` : "No courses available."}
                  </p>
                )}
                {pickerFiltered.map((course) => {
                  const checked = lPickerDraft.includes(course.id);
                  return (
                    <div role="listitem" key={course.id} className={`cm-picker-row${checked ? " checked" : ""}`}>
                      <input
                        type="checkbox" checked={checked} aria-label={`Select ${course.name}`}
                        onChange={(e) => {
                          if (e.target.checked) setLPickerDraft((d) => [...d, course.id]);
                          else setLPickerDraft((d) => d.filter((id) => id !== course.id));
                        }}
                      />
                      <span className="cm-picker-name">{course.name}</span>
                      <label className="cm-course-mandatory"><input type="checkbox" disabled={!checked} checked={checked && (lPickerRequirements[course.id] ?? true)} aria-label={`Mandatory for ${course.name}`} onChange={(e) => setLPickerRequirements((prev) => ({ ...prev, [course.id]: e.target.checked }))} /><span>Mandatory</span></label>
                    </div>
                  );
                })}
              </div>
              <div className="cm-dialog-actions cm-picker-footer">
                <span className="cm-picker-count">{lPickerDraft.length} Selected</span>
                <button type="button" className="cm-button" onClick={() => setLevelPicker(null)}>Cancel</button>
                <button type="button" className="cm-button primary" disabled={!hasChanged} onClick={applyLevelPicker}>
                  Apply Selection
                </button>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
    </>
  );

  /* ── SKILLS VIEW ── */
  if (view.kind === "skills") {
    const comp = data.competencies.find((c) => c.id === view.cId);
    if (!comp) { setView({ kind: "list" }); return null; }
    const skills = compSkills(data, comp.id);

    return (
      <section className="cm-card cm-unified-library">
        <button className="cm-text-button" onClick={() => { setView({ kind: "list" }); setOpenSkill(null); setEditingSkill(null); }}>
          <ArrowLeft size={15} /> Back to Competencies
        </button>

        <div className="cm-section-head" style={{ marginTop: 18 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0 }}>{comp.name}</h2>
              <span className={"cm-badge " + comp.status.toLowerCase()}>{comp.status}</span>
            </div>
            {comp.description && <p style={{ marginTop: 6 }}>{comp.description}</p>}
          </div>
          <div className="cm-actions">
            <button
              className="cm-button primary"
              disabled={comp.status !== "Active"}
              title={comp.status !== "Active" ? "Set This Competency to Active Before Adding Skills" : ""}
              onClick={() => {
                /* open create-skill via Editor in "add" mode */
                setEditingSkill("__new__");
              }}
            >
              <Plus size={15} /> Add Skill
            </button>
          </div>
        </div>

        {comp.status !== "Active" && (
          <p className="cm-hint">Set this competency to Active using Edit before adding skills.</p>
        )}

        {/* Add-skill inline form */}
        {editingSkill === "__new__" && (
          <SkillInlineEdit
            skill={withComps({ id: uid(), name: "", description: "", status: "Active", levels: {} }, [comp.id])}
            data={data}
            work={work}
            onSaveWork={onSaveWork}
            onSave={(item, nextWork) => {
              if (commit({ ...data, skills: [...data.skills, item], ...(nextWork ? { workflow: nextWork } : {}) }, `Added skill "${item.name}"`))
                setEditingSkill(null);
            }}
            onCancel={() => setEditingSkill(null)}
          />
        )}

        {/* Skill accordions */}
        {skills.length === 0 && editingSkill !== "__new__" ? (
          <div className="cm-empty">
            <Target size={24} />
            <h3>No Skills Yet</h3>
            <p>Add the specific abilities that make up this competency.</p>
          </div>
        ) : (
          <div className="cm-skill-accordion-list">
            {skills.map((s) => {
              const isOpen = openSkill === s.id;
              const isEditing = editingSkill === s.id;
              // Show every active level, even without a description.
              const definedLevels = compSkillLevels(data, comp.id, s);

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
                      <DisclosureIcon open={isOpen} />
                      <span className="cm-skill-accordion-name">
                        <span className="cm-table-link">{s.name}</span>
                        {s.description && <small>{s.description}</small>}
                      </span>
                      <span className="cm-skill-accordion-meta">
                        <span className="cm-category">
                          {definedLevels.length} {definedLevels.length === 1 ? "Level" : "Levels"}
                        </span>
                      </span>
                    </button>

                    <div className="cm-row-actions" style={{ padding: "0 12px", flexShrink: 0 }}>
                      <button
                        className="cm-icon-button"
                        aria-label={"Edit " + s.name}
                        title="Edit Skill"
                        onClick={() => {
                          setOpenSkill(s.id);
                          setEditingSkill(isEditing ? null : s.id);
                        }}
                      >
                        {isEditing ? <X size={15} /> : <Pencil size={15} />}
                      </button>
                      {s.status === "Active" ? (
                        <button
                          className="cm-icon-button"
                          aria-label={"Inactivate " + s.name}
                          title="Inactivate Skill"
                          onClick={() => setInactivatingSkill(s)}
                        >
                          <Ban size={16} />
                        </button>
                      ) : (
                        <button
                          className="cm-icon-button"
                          aria-label={"Activate " + s.name}
                          title="Activate Skill"
                          onClick={() =>
                            commit(
                              { ...data, skills: data.skills.map((x) => x.id === s.id ? { ...x, status: "Active" as const } : x) },
                              `${s.name} activated`,
                            )
                          }
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      <button
                        className="cm-icon-button danger"
                        aria-label={(compIdsOf(s).length > 1 ? "Remove " : "Delete ") + s.name}
                        title={compIdsOf(s).length > 1 ? "Remove from This Competency" : "Delete Skill"}
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
                              <span className="cm-accordion-section-label">Proficiency Levels</span>
                              <div className="cm-level-tree">
                                {definedLevels.map((l, i) => {
                                  const levelCourses = (work?.courses ?? []).filter((c) =>
                                    c.mappings.some((m) => m.skillId === s.id && m.levelId === l.id),
                                  );
                                  return (
                                    <div key={l.id} className={"cm-level-node" + (i === definedLevels.length - 1 ? " last" : "")}>
                                      <div className="cm-level-num-badge">{i + 1}</div>
                                      <div className="cm-level-node-content">
                                        <strong>{l.name}</strong>
                                        <p style={s.levels?.[l.id]?.trim() ? undefined : { fontStyle: "italic" }}>{s.levels?.[l.id]?.trim() || "No description added"}</p>
                                      </div>
                                      {work && onSaveWork ? (
                                        <button
                                          type="button"
                                          className={levelCourses.length > 0 ? "cm-course-count-badge" : "cm-map-courses-btn"}
                                          onClick={() => openLevelPicker(s.id, l.id)}
                                        >
                                          {levelCourses.length > 0 ? (
                                            <><BookOpen size={12} /> Mapped Courses · {levelCourses.length}</>
                                          ) : (
                                            <><Plus size={11} /> Map Courses</>
                                          )}
                                        </button>
                                      ) : levelCourses.length > 0 ? (
                                        <button
                                          type="button"
                                          className="cm-course-count-badge"
                                          onClick={() => setLevelCourseView({ skillId: s.id, levelId: l.id })}
                                        >
                                          <BookOpen size={12} />
                                          Mapped Courses · {levelCourses.length}
                                        </button>
                                      ) : null}
                                    </div>
                                  );
                                })}
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
            <Upload size={16} /> Bulk Upload
          </button>
          <button className="cm-button primary" onClick={() => setCreating(true)}>
            <Plus size={16} /> Create Competency
          </button>
        </div>
      </div>

      <div className="cm-toolbar">
        <label className="cm-search">
          <Search size={17} />
          <input
            aria-label="Search Competencies and Skills"
            placeholder="Search a competency or skill…"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
          />
        </label>
        {term && (
          <button className="cm-text-button" onClick={() => onQuery("")}>Clear Search</button>
        )}
        <select aria-label="Filter Competency Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
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
                  <th>Skills</th>
                  <th>Status</th>
                  <th className="cm-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.slice((current - 1) * 10, current * 10).map((c) => {
                  const children = data.skills.filter((s) => inComp(s, c.id));
                  return (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.name}</strong>
                        <small>{c.description || "No description added"}</small>
                      </td>
                      <td>
                        <button
                          className="cm-table-link"
                          onClick={() => { setView({ kind: "skills", cId: c.id }); setOpenSkill(null); setEditingSkill(null); }}
                        >
                          {children.length} {children.length === 1 ? "Skill" : "Skills"}
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
                          {c.status === "Active" ? (
                            <button
                              className="cm-icon-button"
                              aria-label={"Inactivate " + c.name}
                              title="Inactivate Competency"
                              onClick={() => setInactivatingComp(c)}
                            >
                              <Ban size={16} />
                            </button>
                          ) : (
                            <button
                              className="cm-icon-button"
                              aria-label={"Activate " + c.name}
                              title="Activate Competency"
                              onClick={() =>
                                commit(
                                  { ...data, competencies: data.competencies.map((x) => x.id === c.id ? { ...x, status: "Active" as const } : x) },
                                  `${c.name} activated`,
                                )
                              }
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          )}
                          <button
                            className="cm-icon-button danger"
                            aria-label={"Delete " + c.name}
                            title="Delete Competency"
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
            <span>{visible.length} Competencies Found</span>
            <div>
              <button className="cm-button" disabled={current === 1} onClick={() => setPage(current - 1)}>Previous</button>
              <span>Page {current} Of {pages}</span>
              <button className="cm-button" disabled={current === pages} onClick={() => setPage(current + 1)}>Next</button>
            </div>
          </footer>
        </>
      ) : (
        <div className="cm-empty">
          <Search size={26} />
          <h3>No Matching Competencies or Skills</h3>
          <p>Try another name or clear the filters.</p>
          <button className="cm-button" onClick={() => { onQuery(""); setStatus(""); }}>
            Clear Filters
          </button>
        </div>
      )}
      {sharedModals}
    </section>
  );
}
