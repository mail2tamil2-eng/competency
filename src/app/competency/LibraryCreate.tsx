import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { Data, RecordItem, uid, validate } from "./model";
import { WorkflowData, Course } from "./workflowModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";

type CourseMappings = Record<string, Record<string, string[]>>;
type CourseWeightages = Record<string, Record<string, Record<string, number>>>;

const blankSkill = (): RecordItem => ({
  id: uid(),
  name: "",
  description: "",
  status: "Active",
  levels: {},
});

/* ── Skill accordion card ─────────────────────────────────────────────────── */
function SkillAccordionCard({
  skill,
  index,
  isOpen,
  canRemove,
  levels,
  hasIssues,
  expandedLevels,
  onToggle,
  onRemove,
  onUpdate,
  onToggleLevel,
  getLevelCourses,
  courseWeightages,
  onOpenPicker,
  onSetLevelCourses,
  onSetWeightage,
  courseMappings,
}: {
  skill: RecordItem;
  index: number;
  isOpen: boolean;
  canRemove: boolean;
  levels: RecordItem[];
  hasIssues: boolean;
  expandedLevels: Set<string>;
  onToggle: () => void;
  onRemove: () => void;
  onUpdate: (patch: Partial<RecordItem>) => void;
  onToggleLevel: (levelId: string) => void;
  getLevelCourses: (levelId: string) => Course[];
  courseWeightages: CourseWeightages;
  onOpenPicker: (levelId: string) => void;
  onSetLevelCourses: (levelId: string, ids: string[]) => void;
  onSetWeightage: (levelId: string, courseId: string, raw: string) => void;
  courseMappings: CourseMappings;
}) {
  const label = skill.name.trim() || `Skill ${index + 1}`;

  return (
    <div className={`cm-create-skill-card${isOpen ? " is-open" : ""}`}>
      <button
        type="button"
        className="cm-create-skill-card-header"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <ChevronDown
          size={16}
          className={isOpen ? "cm-rotated" : ""}
          style={{ flexShrink: 0, color: "#526176", transition: "transform 0.15s" }}
        />
        <span className="cm-create-skill-card-name">{label}</span>
        <span className={`cm-create-skill-status${hasIssues ? " needs" : " ready"}`}>
          {hasIssues ? "Needs details" : "Ready"}
        </span>
        {canRemove && (
          <button
            type="button"
            className="cm-icon-button danger"
            aria-label={`Remove ${label}`}
            style={{ marginLeft: 4 }}
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
          >
            <Trash2 size={14} />
          </button>
        )}
      </button>

      {isOpen && (
        <div className="cm-create-skill-card-body">
          <label>
            <span className="cm-req-label">Skill name <span className="req">*</span></span>
            <input
              autoFocus
              aria-label="Skill name"
              maxLength={120}
              value={skill.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="e.g. Active Listening"
            />
          </label>

          <label>
            <span>Description <span className="cm-field-optional">optional</span></span>
            <textarea
              rows={2}
              value={skill.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="What will the learner be able to do?"
            />
          </label>

          {levels.length > 0 && (
            <div className="cm-proficiency-section">
              <p className="cm-proficiency-label">Proficiency levels</p>
              {levels.map((l) => {
                const key = `${skill.id}:${l.id}`;
                const expanded = expandedLevels.has(key);
                const desc = skill.levels?.[l.id]?.trim() ?? "";
                const mapped = getLevelCourses(l.id);
                return (
                  <div key={l.id} className={`cm-level-row${expanded ? " expanded" : ""}`}>
                    <button
                      type="button"
                      className="cm-level-row-toggle"
                      aria-expanded={expanded}
                      onClick={() => onToggleLevel(l.id)}
                    >
                      {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      <span className="cm-level-row-name">{l.name}</span>
                      <span className="cm-level-row-preview">
                        {desc || <em>Description required</em>}
                      </span>
                      <span className="cm-level-row-meta">
                        {mapped.length > 0 ? `${mapped.length} course${mapped.length !== 1 ? "s" : ""}` : ""}
                      </span>
                    </button>
                    {expanded && (
                      <div className="cm-level-row-body">
                        <label>
                          <span className="cm-req-label">Proficiency description <span className="req">*</span></span>
                          <textarea
                            rows={3}
                            aria-label={`${l.name} proficiency description`}
                            value={skill.levels?.[l.id] ?? ""}
                            onChange={(e) =>
                              onUpdate({ levels: { ...skill.levels, [l.id]: e.target.value } })
                            }
                            placeholder={`What can someone do at ${l.name.toLowerCase()} level?`}
                          />
                        </label>
                        <div className="cm-level-courses">
                          <div className="cm-level-courses-hd">
                            <span>Mapped courses ({mapped.length})</span>
                            <button type="button" className="cm-map-courses-btn" onClick={() => onOpenPicker(l.id)}>
                              <Plus size={11} /> Map courses
                            </button>
                          </div>
                          {mapped.length === 0 ? (
                            <p className="cm-level-no-courses">No courses mapped.</p>
                          ) : (
                              <div className="cm-course-list">
                                    {mapped.map((c) => (
                                      <div key={c.id} className="cm-course-row">
                                        <span className="cm-course-row-name">{c.name}</span>
                                        <button
                                          type="button"
                                          aria-label={`Remove ${c.name}`}
                                          className="cm-course-row-remove"
                                          onClick={() =>
                                            onSetLevelCourses(
                                              l.id,
                                              (courseMappings[skill.id]?.[l.id] ?? []).filter((id) => id !== c.id),
                                            )
                                          }
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>
                                    ))}
                              </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {levels.length === 0 && (
            <p className="cm-field-hint">No active levels — manage in Library settings.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */
export function LibraryCreate({
  data,
  onClose,
  onSave,
  onSaveWork,
  initial,
}: {
  data: Data;
  onClose: () => void;
  onSave: (competency: RecordItem, skills: RecordItem[]) => void;
  onSaveWork?: (work: WorkflowData, msg: string) => boolean;
  initial?: { competency: RecordItem; skills: RecordItem[] };
}) {
  const isEdit = !!initial;

  const [competency, setCompetency] = useState<RecordItem>(() =>
    initial ? structuredClone(initial.competency) : { id: uid(), name: "", description: "", categoryId: "", status: "Active" },
  );
  const [skills, setSkills] = useState<RecordItem[]>(() =>
    initial ? initial.skills.map((s) => structuredClone(s)) : [blankSkill()],
  );
  const [openSkillId, setOpenSkillId] = useState<string | null>(
    initial ? (initial.skills[0]?.id ?? null) : null,
  );
  const [courseMappings, setCourseMappings] = useState<CourseMappings>(() => {
    if (!initial) return {};
    const maps: CourseMappings = {};
    for (const course of data.workflow?.courses ?? []) {
      for (const m of course.mappings) {
        if (!initial.skills.some((s) => s.id === m.skillId)) continue;
        if (!maps[m.skillId]) maps[m.skillId] = {};
        if (!maps[m.skillId][m.levelId]) maps[m.skillId][m.levelId] = [];
        maps[m.skillId][m.levelId].push(course.id);
      }
    }
    return maps;
  });
  const [courseWeightages, setCourseWeightages] = useState<CourseWeightages>(() => {
    if (!initial) return {};
    const weights: CourseWeightages = {};
    for (const course of data.workflow?.courses ?? []) {
      for (const m of course.mappings) {
        if (!initial.skills.some((s) => s.id === m.skillId) || m.weightage == null) continue;
        if (!weights[m.skillId]) weights[m.skillId] = {};
        if (!weights[m.skillId][m.levelId]) weights[m.skillId][m.levelId] = {};
        weights[m.skillId][m.levelId][course.id] = m.weightage;
      }
    }
    return weights;
  });
  // Keys are `${skillId}:${levelId}` so each skill tracks its own expanded levels
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const [pickerKey, setPickerKey] = useState<{ skillId: string; levelId: string } | null>(null);
  const [pickerDraft, setPickerDraft] = useState<string[]>([]);
  const [pickerOriginal, setPickerOriginal] = useState<string[]>([]);
  const [pickerWeightages, setPickerWeightages] = useState<Record<string, number>>({});
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerShowSelected, setPickerShowSelected] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errors.length) errorRef.current?.focus();
  }, [errors]);

  const levels = data.levels.filter((l) => l.status === "Active");
  const allCourses = data.workflow?.courses ?? [];

  function updateSkill(id: string, patch: Partial<RecordItem>) {
    setSkills((cur) => cur.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function getLevelCourses(skillId: string, levelId: string): Course[] {
    return (courseMappings[skillId]?.[levelId] ?? [])
      .map((id) => allCourses.find((c) => c.id === id))
      .filter((c): c is Course => c != null);
  }

  function setLevelCourses(skillId: string, levelId: string, ids: string[]) {
    setCourseMappings((prev) => ({ ...prev, [skillId]: { ...prev[skillId], [levelId]: ids } }));
    setCourseWeightages((prev) => {
      const existing = prev[skillId]?.[levelId] ?? {};
      const next: Record<string, number> = {};
      ids.forEach((id) => { if (id in existing) next[id] = existing[id]; });
      return { ...prev, [skillId]: { ...prev[skillId], [levelId]: next } };
    });
  }

  function setWeightage(skillId: string, levelId: string, courseId: string, raw: string) {
    const v = Math.max(0, Math.min(100, parseInt(raw, 10) || 0));
    setCourseWeightages((prev) => ({
      ...prev,
      [skillId]: { ...prev[skillId], [levelId]: { ...prev[skillId]?.[levelId], [courseId]: v } },
    }));
  }

  function addSkill() {
    const s = blankSkill();
    setSkills((cur) => [...cur, s]);
    setOpenSkillId(s.id);
    setErrors([]);
  }

  function removeSkill(id: string) {
    const idx = skills.findIndex((s) => s.id === id);
    const remaining = skills.filter((s) => s.id !== id);
    setSkills(remaining);
    if (openSkillId === id)
      setOpenSkillId(remaining[Math.max(0, idx - 1)]?.id ?? null);
    setCourseMappings((prev) => { const next = { ...prev }; delete next[id]; return next; });
  }

  function toggleLevel(skillId: string, levelId: string) {
    const key = `${skillId}:${levelId}`;
    setExpandedLevels((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function openPicker(skillId: string, levelId: string) {
    const existing = [...(courseMappings[skillId]?.[levelId] ?? [])];
    setPickerDraft(existing);
    setPickerOriginal(existing);
    setPickerWeightages(courseWeightages[skillId]?.[levelId] ?? {});
    setPickerSearch("");
    setPickerShowSelected(false);
    setPickerKey({ skillId, levelId });
  }

  function applyPicker() {
    if (!pickerKey) return;
    const { skillId, levelId } = pickerKey;
    setCourseMappings((prev) => ({ ...prev, [skillId]: { ...prev[skillId], [levelId]: pickerDraft } }));
    setCourseWeightages((prev) => ({
      ...prev,
      [skillId]: {
        ...prev[skillId],
        [levelId]: Object.fromEntries(pickerDraft.map((id) => [id, pickerWeightages[id] ?? 0])),
      },
    }));
    setPickerKey(null);
  }

  const clean = {
    ...competency,
    name: competency.name.trim(),
    description: competency.description.trim(),
  };
  const linked = skills.map((s) => ({
    ...s,
    name: s.name.trim(),
    description: s.description.trim(),
    categoryId: competency.categoryId,
    competencyId: competency.id,
  }));

  function skillIssues(s: RecordItem, i: number, proficiency = true) {
    const issues: string[] = [];
    const name = s.name.trim();
    const label = name || `Skill ${i + 1}`;
    if (!name) issues.push(`Skill ${i + 1}: enter a name.`);
    if (name.length > 120) issues.push(`${label}: use 120 characters or fewer.`);
    if (
      name &&
      (skills.some((x) => x.id !== s.id && x.name.trim().toLowerCase() === name.toLowerCase()) ||
        data.skills.some((x) => x.id !== s.id && x.name.trim().toLowerCase() === name.toLowerCase()))
    )
      issues.push(`${label}: this skill name already exists.`);
    if (proficiency)
      for (const l of levels)
        if (!s.levels?.[l.id]?.trim()) issues.push(`${label}: describe ${l.name}.`);
    return issues;
  }

  function saveDraft() {
    const kept = linked.filter(
      (s) => s.name || s.description || Object.values(s.levels ?? {}).some((v) => v.trim()),
    );
    const issues = [
      ...validate(clean, "competencies", data),
      ...kept.flatMap((s) => skillIssues(s, skills.findIndex((x) => x.id === s.id), false)),
    ];
    const deduped = [...new Set(issues)];
    setErrors(deduped);
    if (!deduped.length)
      onSave({ ...clean, status: "Draft" }, kept.map((s) => ({ ...s, status: "Draft" })));
  }

  function handleFinalSave() {
    const dataForValidate = isEdit
      ? { ...data, competencies: data.competencies.filter((c) => c.id !== clean.id) }
      : data;
    const issues = [
      ...validate(clean, "competencies", dataForValidate),
      ...(linked.length === 0 ? ["Add at least one skill, or save as draft."] : []),
      ...linked.flatMap((s, i) => skillIssues(s, i)),
    ];
    const deduped = [...new Set(issues)];
    setErrors(deduped);
    if (deduped.length) {
      const bad = skills.find((s, i) => skillIssues(s, i).length);
      if (bad) setOpenSkillId(bad.id);
      return;
    }
    if (onSaveWork && data.workflow) {
      const updatedCourses = data.workflow.courses.map((course) => {
        const newMaps: { skillId: string; levelId: string; weightage?: number }[] = [];
        for (const skill of linked) {
          for (const [levelId, ids] of Object.entries(courseMappings[skill.id] ?? {})) {
            if (
              ids.includes(course.id) &&
              !course.mappings.some((m) => m.skillId === skill.id && m.levelId === levelId)
            )
              newMaps.push({
                skillId: skill.id,
                levelId,
                weightage: courseWeightages[skill.id]?.[levelId]?.[course.id],
              });
          }
        }
        return newMaps.length ? { ...course, mappings: [...course.mappings, ...newMaps] } : course;
      });
      if (updatedCourses.some((c, i) => c !== data.workflow!.courses[i]))
        onSaveWork({ ...data.workflow, courses: updatedCourses }, `Mapped courses for "${clean.name}"`);
    }
    onSave(clean, linked);
  }

  function handleClose() {
    const dirty =
      competency.name.trim() ||
      competency.description.trim() ||
      competency.categoryId ||
      skills.some(
        (s) =>
          s.name.trim() ||
          s.description.trim() ||
          Object.values(s.levels ?? {}).some((v) => v.trim()),
      );
    if (dirty && !window.confirm("Discard unsaved changes and close?")) return;
    onClose();
  }

  const pickerFiltered = allCourses.filter((c) => {
    if (pickerShowSelected && !pickerDraft.includes(c.id)) return false;
    return !pickerSearch || c.name.toLowerCase().includes(pickerSearch.toLowerCase());
  });

  // ── COURSE PICKER ──────────────────────────────────────────────────────────
  if (pickerKey) {
    const skillName = skills.find((s) => s.id === pickerKey.skillId)?.name.trim() ?? "";
    const levelName = levels.find((l) => l.id === pickerKey.levelId)?.name ?? pickerKey.levelId;
    const subtitle = skillName ? `${skillName} · ${levelName}` : levelName;
    const hasChanged =
      pickerDraft.length !== pickerOriginal.length ||
      pickerDraft.some((id) => !pickerOriginal.includes(id)) ||
      pickerOriginal.some((id) => !pickerDraft.includes(id));

    return (
      <Dialog open onOpenChange={(open) => { if (!open) setPickerKey(null); }}>
        <DialogContent className="cm-dialog cm-picker-dialog">
          <DialogHeader className="cm-picker-header">
            <DialogTitle>Map courses</DialogTitle>
            <DialogDescription>{subtitle}</DialogDescription>
            <p className="cm-picker-hint">Select courses to support this proficiency level.</p>
          </DialogHeader>
          <div className="cm-picker-controls">
            <div className="cm-picker-search">
              <Search size={15} className="cm-picker-search-icon" />
              <input
                autoFocus type="text" placeholder="Search courses…"
                value={pickerSearch} onChange={(e) => setPickerSearch(e.target.value)}
              />
              {pickerSearch && (
                <button type="button" className="cm-picker-clear-btn" onClick={() => setPickerSearch("")} aria-label="Clear search">
                  <X size={13} />
                </button>
              )}
            </div>
            <div className="cm-picker-filter-row">
              <button type="button" className={`cm-picker-filter-btn${!pickerShowSelected ? " active" : ""}`} onClick={() => setPickerShowSelected(false)}>
                All courses ({allCourses.length})
              </button>
              <button type="button" className={`cm-picker-filter-btn${pickerShowSelected ? " active" : ""}`} onClick={() => setPickerShowSelected(true)}>
                Selected ({pickerDraft.length})
              </button>
            </div>
          </div>
          <div className="cm-picker-list" role="list">
            {pickerFiltered.length === 0 && (
              <p className="cm-picker-empty">
                {pickerShowSelected ? "No courses selected yet." : pickerSearch ? `No results for "${pickerSearch}".` : "No courses available."}
              </p>
            )}
            {pickerFiltered.map((course) => {
              const checked = pickerDraft.includes(course.id);
              return (
                <label key={course.id} className={`cm-picker-row${checked ? " checked" : ""}`}>
                  <input
                    type="checkbox" checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) setPickerDraft((d) => [...d, course.id]);
                      else setPickerDraft((d) => d.filter((id) => id !== course.id));
                    }}
                  />
                  <span className="cm-picker-name">{course.name}</span>
                </label>
              );
            })}
          </div>
          <div className="cm-dialog-actions cm-picker-footer">
            <span className="cm-picker-count">
              {pickerDraft.length === 0
                ? "None selected"
                : `${pickerDraft.length} course${pickerDraft.length !== 1 ? "s" : ""} selected`}
            </span>
            <button type="button" className="cm-button" onClick={() => setPickerKey(null)}>Cancel</button>
            <button type="button" className="cm-button primary" disabled={!hasChanged} onClick={applyPicker}>
              Apply selection
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── MAIN FORM ────────────────────────────────────────────────────────────
  return (
    <section className="cm-inline-form cm-create-inline">
      <div className="cm-inline-form-head">
        <button type="button" className="cm-text-button cm-inline-back" onClick={handleClose}>
          ← Competency framework
        </button>
        <h2>{isEdit ? "Edit competency & skills" : "Create competency & skills"}</h2>
      </div>

      {errors.length > 0 && (
        <div className="cm-error" role="alert" ref={errorRef} tabIndex={-1}>
          {errors.map((e) => <div key={e}>{e}</div>)}
        </div>
      )}

      {/* ── Competency details ── */}
      <div className="cm-config-section">
        <h3>Competency details</h3>
        <div className="cm-create-step1">
          <label>
            <span className="cm-req-label">Competency name <span className="req">*</span></span>
            <input
              autoFocus
              aria-label="Competency name"
              maxLength={120}
              value={competency.name}
              onChange={(e) => setCompetency({ ...competency, name: e.target.value })}
              placeholder="e.g. Communication"
            />
          </label>
          <label>
            <span className="cm-req-label">Category <span className="req">*</span></span>
            <select
              aria-label="Category"
              value={competency.categoryId}
              onChange={(e) => setCompetency({ ...competency, categoryId: e.target.value })}
            >
              <option value="">Select a category</option>
              {data.categories.filter((c) => c.status === "Active").map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <p className="cm-field-hint">Manage categories in Library settings.</p>
          </label>
          <label>
            <span>Description <span className="cm-field-optional">optional</span></span>
            <textarea
              value={competency.description}
              onChange={(e) => setCompetency({ ...competency, description: e.target.value })}
              placeholder="What broad capability does this describe?"
              rows={3}
            />
          </label>
          {isEdit && (
            <label>
              <span>Status</span>
              <select
                value={competency.status}
                onChange={(e) => setCompetency({ ...competency, status: e.target.value as RecordItem["status"] })}
              >
                <option>Active</option>
                <option>Inactive</option>
                <option>Draft</option>
              </select>
            </label>
          )}
        </div>
      </div>

      {/* ── Skills & courses ── */}
      <div className="cm-config-section">
        <h3>Skills &amp; courses</h3>
        <div className="cm-create-skills">
          {skills.map((s, i) => (
            <SkillAccordionCard
              key={s.id}
              skill={s}
              index={i}
              isOpen={openSkillId === s.id || (openSkillId === null && i === 0)}
              canRemove={skills.length > 1}
              levels={levels}
              hasIssues={skillIssues(s, i).length > 0}
              expandedLevels={expandedLevels}
              onToggle={() =>
                setOpenSkillId(
                  (openSkillId === s.id || (openSkillId === null && i === 0)) ? "__none__" : s.id,
                )
              }
              onRemove={() => removeSkill(s.id)}
              onUpdate={(patch) => updateSkill(s.id, patch)}
              onToggleLevel={(levelId) => toggleLevel(s.id, levelId)}
              getLevelCourses={(levelId) => getLevelCourses(s.id, levelId)}
              courseWeightages={courseWeightages}
              onOpenPicker={(levelId) => openPicker(s.id, levelId)}
              onSetLevelCourses={(levelId, ids) => setLevelCourses(s.id, levelId, ids)}
              onSetWeightage={(levelId, courseId, raw) => setWeightage(s.id, levelId, courseId, raw)}
              courseMappings={courseMappings}
            />
          ))}
          <button type="button" className="cm-create-add-skill" onClick={addSkill}>
            <Plus size={15} /> Add skill
          </button>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="cm-inline-form-actions" style={{ borderTop: "1px solid #e5e7eb", paddingTop: 16 }}>
        <button type="button" className="cm-button" onClick={handleClose}>
          Cancel
        </button>
        {!isEdit && skills.some(
          (s) => s.name.trim() || s.description.trim() || Object.values(s.levels ?? {}).some((v) => v.trim()),
        ) && (
          <button type="button" className="cm-button" onClick={saveDraft}>
            Save as draft
          </button>
        )}
        <button type="button" className="cm-button primary" onClick={handleFinalSave}>
          {isEdit ? "Save changes" : "Create competency"}
        </button>
      </div>
    </section>
  );
}
