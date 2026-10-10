import { useState, useEffect, useRef, Fragment } from "react";
import {
  Plus,
  Trash2,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Search,
  X,
} from "lucide-react";
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

const blankSkill = (): RecordItem => ({
  id: uid(),
  name: "",
  description: "",
  status: "Active",
  levels: {},
});

export function LibraryCreate({
  data,
  onClose,
  onSave,
  onSaveWork,
}: {
  data: Data;
  onClose: () => void;
  onSave: (competency: RecordItem, skills: RecordItem[]) => void;
  onSaveWork?: (work: WorkflowData, msg: string) => boolean;
}) {
  const [step, setStep] = useState(1);
  const [competency, setCompetency] = useState<RecordItem>(() => ({
    id: uid(),
    name: "",
    description: "",
    categoryId: "",
    status: "Active",
  }));
  const [skills, setSkills] = useState<RecordItem[]>(() => [blankSkill()]);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [courseMappings, setCourseMappings] = useState<CourseMappings>({});
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const [pickerKey, setPickerKey] = useState<{ skillId: string; levelId: string } | null>(null);
  const [pickerDraft, setPickerDraft] = useState<string[]>([]);
  const [pickerOriginal, setPickerOriginal] = useState<string[]>([]);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerShowSelected, setPickerShowSelected] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errors.length) errorRef.current?.focus();
  }, [errors]);

  const levels = data.levels.filter((l) => l.status === "Active");
  const allCourses = data.workflow?.courses ?? [];
  const selectedSkill = skills.find((s) => s.id === selectedSkillId) ?? skills[0];

  function selectSkill(id: string) {
    setSelectedSkillId(id);
    setExpandedLevels(new Set());
    setErrors([]);
  }

  function updateSkill(id: string, patch: Partial<RecordItem>) {
    setSkills((cur) => cur.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function getLevelCourses(skillId: string, levelId: string): Course[] {
    return (courseMappings[skillId]?.[levelId] ?? [])
      .map((id) => allCourses.find((c) => c.id === id))
      .filter((c): c is Course => c != null);
  }

  function setLevelCourses(skillId: string, levelId: string, ids: string[]) {
    setCourseMappings((prev) => ({
      ...prev,
      [skillId]: { ...prev[skillId], [levelId]: ids },
    }));
  }

  function addSkill() {
    const s = blankSkill();
    setSkills((cur) => [...cur, s]);
    selectSkill(s.id);
  }

  function removeSkill(id: string) {
    const idx = skills.findIndex((s) => s.id === id);
    const remaining = skills.filter((s) => s.id !== id);
    setSkills(remaining);
    if (selectedSkillId === id) {
      selectSkill(remaining[Math.max(0, idx - 1)]?.id ?? remaining[0]?.id ?? "");
    }
    setCourseMappings((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function toggleLevel(levelId: string) {
    setExpandedLevels((prev) => {
      const next = new Set(prev);
      next.has(levelId) ? next.delete(levelId) : next.add(levelId);
      return next;
    });
  }

  function openPicker(skillId: string, levelId: string) {
    const existing = [...(courseMappings[skillId]?.[levelId] ?? [])];
    setPickerDraft(existing);
    setPickerOriginal(existing);
    setPickerSearch("");
    setPickerShowSelected(false);
    setPickerKey({ skillId, levelId });
  }

  function applyPicker() {
    if (!pickerKey) return;
    setLevelCourses(pickerKey.skillId, pickerKey.levelId, pickerDraft);
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
      (skills.some(
        (x) => x.id !== s.id && x.name.trim().toLowerCase() === name.toLowerCase()
      ) ||
        data.skills.some((x) => x.name.trim().toLowerCase() === name.toLowerCase()))
    )
      issues.push(`${label}: this skill name already exists.`);
    if (proficiency)
      for (const l of levels)
        if (!s.levels?.[l.id]?.trim()) issues.push(`${label}: describe ${l.name}.`);
    return issues;
  }

  function issuesFor(stage: number) {
    const issues = validate(clean, "competencies", data);
    if (stage >= 2) {
      if (!linked.length) issues.push("Add at least one skill, or save as draft.");
      for (const [i, s] of linked.entries()) issues.push(...skillIssues(s, i));
    }
    return [...new Set(issues)];
  }

  function advance() {
    const issues = issuesFor(step);
    setErrors(issues);
    if (!issues.length) { setStep(step + 1); return; }
    if (step === 2) {
      const bad = skills.find((s, i) => skillIssues(s, i).length);
      if (bad) selectSkill(bad.id);
    }
  }

  function saveDraft() {
    const kept = linked.filter(
      (s) => s.name || s.description || Object.values(s.levels ?? {}).some((v) => v.trim())
    );
    const issues = [
      ...issuesFor(1),
      ...kept.flatMap((s) =>
        skillIssues(s, skills.findIndex((x) => x.id === s.id), false)
      ),
    ];
    setErrors(issues);
    if (!issues.length)
      onSave({ ...clean, status: "Draft" }, kept.map((s) => ({ ...s, status: "Draft" })));
  }

  function handleFinalSave() {
    const issues = issuesFor(3);
    setErrors(issues);
    if (issues.length) return;
    if (onSaveWork && data.workflow) {
      const updatedCourses = data.workflow.courses.map((course) => {
        const newMaps: { skillId: string; levelId: string }[] = [];
        for (const skill of linked) {
          for (const [levelId, ids] of Object.entries(courseMappings[skill.id] ?? {})) {
            if (
              ids.includes(course.id) &&
              !course.mappings.some((m) => m.skillId === skill.id && m.levelId === levelId)
            )
              newMaps.push({ skillId: skill.id, levelId });
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
          Object.values(s.levels ?? {}).some((v) => v.trim())
      );
    if (dirty && !window.confirm("Discard unsaved changes and close?")) return;
    onClose();
  }

  const completeCount = skills.filter((s, i) => !skillIssues(s, i).length).length;

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
                autoFocus
                type="text"
                placeholder="Search courses…"
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
              />
              {pickerSearch && (
                <button
                  type="button"
                  className="cm-picker-clear-btn"
                  onClick={() => setPickerSearch("")}
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <div className="cm-picker-filter-row">
              <button
                type="button"
                className={`cm-picker-filter-btn${!pickerShowSelected ? " active" : ""}`}
                onClick={() => setPickerShowSelected(false)}
              >
                All courses ({allCourses.length})
              </button>
              <button
                type="button"
                className={`cm-picker-filter-btn${pickerShowSelected ? " active" : ""}`}
                onClick={() => setPickerShowSelected(true)}
              >
                Selected ({pickerDraft.length})
              </button>
            </div>
          </div>

          <div className="cm-picker-list" role="list">
            {pickerFiltered.length === 0 && (
              <p className="cm-picker-empty">
                {pickerShowSelected
                  ? "No courses selected yet."
                  : pickerSearch
                  ? `No results for "${pickerSearch}".`
                  : "No courses available."}
              </p>
            )}
            {pickerFiltered.map((course) => {
              const checked = pickerDraft.includes(course.id);
              return (
                <label
                  key={course.id}
                  className={`cm-picker-row${checked ? " checked" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) setPickerDraft((d) => [...d, course.id]);
                      else setPickerDraft((d) => d.filter((id) => id !== course.id));
                    }}
                  />
                  <span className="cm-picker-name">{course.name}</span>
                  {course.duration && (
                    <span className="cm-picker-meta">{course.duration}</span>
                  )}
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
            <button type="button" className="cm-button" onClick={() => setPickerKey(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="cm-button primary"
              disabled={!hasChanged}
              onClick={applyPicker}
            >
              Apply selection
            </button>
          </div>

        </DialogContent>
      </Dialog>
    );
  }

  // ── MAIN WIZARD ────────────────────────────────────────────────────────────
  return (
    <Dialog open onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="cm-dialog cm-wide cm-create-dialog">
        <DialogHeader>
          <DialogTitle>Create competency & skills</DialogTitle>
          <DialogDescription>
            Fill in skills and proficiency descriptions, then save to the library.
          </DialogDescription>
        </DialogHeader>

        <nav aria-label="Progress" className="cm-stepper">
          {(["Competency details", "Skills & courses", "Review"] as const).map((label, i) => {
            const stepNum = i + 1;
            const isDone = step > stepNum;
            const isCurrent = step === stepNum;
            return (
              <Fragment key={label}>
                {i > 0 && (
                  <div
                    className={`cm-stepper-line${step > i ? " done" : ""}`}
                    aria-hidden="true"
                  />
                )}
                <button
                  type="button"
                  className={["cm-stepper-step", isCurrent ? "current" : "", isDone ? "done" : ""].filter(Boolean).join(" ")}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`Step ${stepNum} of 3: ${label}${isDone ? ", completed" : ""}`}
                  disabled={!isDone}
                  onClick={() => { setErrors([]); setStep(stepNum); }}
                >
                  <span className="cm-stepper-circle" aria-hidden="true">
                    {isDone ? <CheckCircle2 size={14} /> : stepNum}
                  </span>
                  <span className="cm-stepper-label">{label}</span>
                </button>
              </Fragment>
            );
          })}
        </nav>
        <div className="cm-stepper-mobile" aria-hidden="true">
          <span>Step {step} of 3 · {["Competency details", "Skills & courses", "Review"][step - 1]}</span>
          <div className="cm-stepper-mobile-bar">
            <div className="cm-stepper-mobile-progress" style={{ width: `${(step / 3) * 100}%` }} />
          </div>
        </div>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (step < 3) { advance(); return; }
            handleFinalSave();
          }}
        >
          <div className="cm-create-content">
            {errors.length > 0 && (
              <div className="cm-error" role="alert" ref={errorRef} tabIndex={-1}>
                {errors.map((e) => <div key={e}>{e}</div>)}
              </div>
            )}

            {/* ── STEP 1 ── */}
            {step === 1 && (
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
                    {data.categories
                      .filter((c) => c.status === "Active")
                      .map((c) => (
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
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div className="cm-create-step2">
                <div className="cm-skill-panel-left">
                  <button type="button" className="cm-add-skill-btn" onClick={addSkill}>
                    <Plus size={13} /> Add skill
                  </button>
                  {skills.map((s, i) => (
                    <div
                      key={s.id}
                      role="button"
                      tabIndex={0}
                      className={`cm-skill-list-item${selectedSkill?.id === s.id ? " selected" : ""}`}
                      onClick={() => selectSkill(s.id)}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && selectSkill(s.id)}
                    >
                      <span className="cm-skill-list-name">
                        {s.name.trim() || `Skill ${i + 1}`}
                      </span>
                      <span className={`cm-skill-list-status${skillIssues(s, i).length ? " needs" : " ready"}`}>
                        {skillIssues(s, i).length ? "Needs details" : "Ready"}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="cm-skill-panel-right">
                  {selectedSkill && (
                    <>
                      <div className="cm-skill-editor-header">
                        <span className="cm-skill-editor-title">
                          {selectedSkill.name.trim() ||
                            `Skill ${skills.indexOf(selectedSkill) + 1}`}
                        </span>
                        {skills.length > 1 && (
                          <button
                            type="button"
                            className="cm-text-button"
                            onClick={() => removeSkill(selectedSkill.id)}
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        )}
                      </div>

                      <label>
                        <span className="cm-req-label">Skill name <span className="req">*</span></span>
                        <input
                          aria-label="Skill name"
                          maxLength={120}
                          value={selectedSkill.name}
                          onChange={(e) =>
                            updateSkill(selectedSkill.id, { name: e.target.value })
                          }
                          placeholder="e.g. Active Listening"
                        />
                      </label>

                      <label>
                        <span>Description <span className="cm-field-optional">optional</span></span>
                        <textarea
                          rows={3}
                          value={selectedSkill.description}
                          onChange={(e) =>
                            updateSkill(selectedSkill.id, { description: e.target.value })
                          }
                          placeholder="What will the learner be able to do?"
                        />
                      </label>

                      <div className="cm-proficiency-section">
                        <p className="cm-proficiency-label">Proficiency levels</p>
                        {levels.length === 0 && (
                          <p className="cm-field-hint">No active levels — manage in Library settings.</p>
                        )}
                        {levels.map((l) => {
                          const expanded = expandedLevels.has(l.id);
                          const desc = selectedSkill.levels?.[l.id]?.trim() ?? "";
                          const mapped = getLevelCourses(selectedSkill.id, l.id);
                          return (
                            <div key={l.id} className={`cm-level-row${expanded ? " expanded" : ""}`}>
                              <button
                                type="button"
                                className="cm-level-row-toggle"
                                aria-expanded={expanded}
                                onClick={() => toggleLevel(l.id)}
                              >
                                {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                <span className="cm-level-row-name">{l.name}</span>
                                <span className="cm-level-row-preview">
                                  {desc || <em>Description required</em>}
                                </span>
                                <span className="cm-level-row-meta">
                                  {mapped.length > 0
                                    ? `${mapped.length} course${mapped.length !== 1 ? "s" : ""}`
                                    : ""}
                                </span>
                              </button>
                              {expanded && (
                                <div className="cm-level-row-body">
                                  <label>
                                    <span className="cm-req-label">Proficiency description <span className="req">*</span></span>
                                    <textarea
                                      rows={3}
                                      aria-label={`${l.name} proficiency description`}
                                      value={selectedSkill.levels?.[l.id] ?? ""}
                                      onChange={(e) =>
                                        updateSkill(selectedSkill.id, {
                                          levels: { ...selectedSkill.levels, [l.id]: e.target.value },
                                        })
                                      }
                                      placeholder={`What can someone do at ${l.name.toLowerCase()} level?`}
                                    />
                                  </label>
                                  <div className="cm-level-courses">
                                    <div className="cm-level-courses-hd">
                                      <span>Mapped courses ({mapped.length})</span>
                                      <button
                                        type="button"
                                        className="cm-map-courses-btn"
                                        onClick={() => openPicker(selectedSkill.id, l.id)}
                                      >
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
                                            {c.duration && (
                                              <span className="cm-course-row-meta">{c.duration}</span>
                                            )}
                                            <button
                                              type="button"
                                              aria-label={`Remove ${c.name}`}
                                              className="cm-course-row-remove"
                                              onClick={() =>
                                                setLevelCourses(
                                                  selectedSkill.id,
                                                  l.id,
                                                  (courseMappings[selectedSkill.id]?.[l.id] ?? []).filter(
                                                    (id) => id !== c.id
                                                  )
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
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && (
              <div className="cm-create-step3">
                <div className="cm-review-competency">
                  <div className="cm-review-comp-header">
                    <div>
                      <h3>{clean.name}</h3>
                      <span className="cm-review-cat">
                        {data.categories.find((c) => c.id === competency.categoryId)?.name}
                      </span>
                      {clean.description && (
                        <p className="cm-review-desc">{clean.description}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="cm-text-button"
                      onClick={() => { setStep(1); setErrors([]); }}
                    >
                      Edit details
                    </button>
                  </div>
                </div>

                <p className="cm-review-skills-label">
                  {skills.length} {skills.length === 1 ? "skill" : "skills"} · {completeCount} complete
                </p>

                {linked.map((s) => (
                  <details key={s.id} className="cm-create-review">
                    <summary>
                      <span className="cm-review-skill-name">{s.name}</span>
                      <span className="cm-review-skill-status">
                        {levels.filter((l) => s.levels?.[l.id]?.trim()).length}/{levels.length} levels
                      </span>
                    </summary>
                    {s.description && <p className="cm-review-desc">{s.description}</p>}
                    <table className="cm-review-table">
                      <thead>
                        <tr>
                          <th>Level</th>
                          <th>Description</th>
                          <th>Courses</th>
                        </tr>
                      </thead>
                      <tbody>
                        {levels.map((l) => {
                          const mapped = getLevelCourses(s.id, l.id);
                          return (
                            <tr key={l.id}>
                              <td>{l.name}</td>
                              <td>{s.levels?.[l.id] || <em>—</em>}</td>
                              <td>{mapped.length > 0 ? mapped.map((c) => c.name).join(", ") : "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <button
                      type="button"
                      className="cm-text-button"
                      onClick={() => { setStep(2); selectSkill(s.id); }}
                    >
                      Edit {s.name}
                    </button>
                  </details>
                ))}

                <p className="cm-field-hint">
                  Adding 1 competency and {skills.length}{" "}
                  {skills.length === 1 ? "skill" : "skills"}. Nothing is saved until you finish.
                </p>
              </div>
            )}
          </div>

          <div className="cm-dialog-actions">
            {step > 1 &&
              skills.some(
                (s) =>
                  s.name.trim() ||
                  s.description.trim() ||
                  Object.values(s.levels ?? {}).some((v) => v.trim())
              ) && (
                <button type="button" className="cm-button" onClick={saveDraft}>
                  Save as draft
                </button>
              )}
            <button
              type="button"
              className="cm-button"
              onClick={() =>
                step === 1 ? onClose() : (setErrors([]), setStep(step - 1))
              }
            >
              {step === 1 ? "Cancel" : "Back"}
            </button>
            <button type="submit" className="cm-button primary">
              {step === 1
                ? "Next: Skills & courses"
                : step === 2
                ? "Review"
                : "Create competency"}
              {step < 3 && <ArrowRight size={14} />}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
