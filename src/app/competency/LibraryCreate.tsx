import { useState, useEffect, useRef } from "react";
import { ChevronDown, X, BookOpen, Search, ArrowLeft } from "lucide-react";
import { DisclosureIcon } from "./Disclosure";
import { useDragReorder, DragHandle } from "./Reorder";
import { Data, RecordItem, uid, validate, compIdsOf, withComps, skillLevels } from "./model";
import { WorkflowData } from "./workflowModel";
import { MultiCheckDropdown } from "./MultiCheckDropdown";

export function LibraryCreate({
  data,
  work,
  onClose,
  onSave,
  onSaveWork,
  initial,
}: {
  data: Data;
  work?: WorkflowData;
  onClose: () => void;
  onSave: (competency: RecordItem, skills: RecordItem[]) => void;
  onSaveWork?: (work: WorkflowData, msg: string) => boolean;
  initial?: { competency: RecordItem; skills: RecordItem[] };
}) {
  const isEdit = !!initial;

  const [competency, setCompetency] = useState<RecordItem>(() =>
    initial ? structuredClone(initial.competency) : { id: uid(), name: "", description: "", status: "Active" },
  );
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>(
    initial ? initial.skills.map((s) => s.id) : [],
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  /* Skill cards whose proficiency levels are hidden. Cards start open. */
  const [collapsedSkills, setCollapsedSkills] = useState<Set<string>>(new Set());
  const toggleSkillCard = (id: string) =>
    setCollapsedSkills((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const [mandatoryMap, setMandatoryMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    if (!work) return map;
    for (const course of work.courses) {
      for (const m of course.mappings) {
        map[`${course.id}:${m.skillId}:${m.levelId}`] = m.mandatory ?? false;
      }
    }
    return map;
  });
  const errorRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLElement>(null);
  const competencyNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    competencyNameRef.current?.focus({ preventScroll: true });
    formRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, []);

  useEffect(() => {
    if (errors.length) errorRef.current?.focus();
  }, [errors]);

  const availableSkills = data.skills.filter((s) => s.status === "Active");


  const clean = {
    ...competency,
    name: competency.name.trim(),
    description: competency.description.trim(),
    // Skills keep the order the admin dragged them into.
    skillOrder: selectedSkillIds,
  };
  const reorder = useDragReorder(selectedSkillIds, setSelectedSkillIds);

  function getLinkedSkills() {
    return selectedSkillIds
      .map((id) => data.skills.find((s) => s.id === id))
      .filter((s): s is RecordItem => s != null)
      // Add this competency to the skill's list; a skill can belong to many competencies.
      .map((s) => withComps(s, [...compIdsOf(s), clean.id]));
  }

  function saveDraft() {
    const dataForValidate = isEdit
      ? { ...data, competencies: data.competencies.filter((c) => c.id !== clean.id) }
      : data;
    const issues = [...new Set(validate(clean, "competencies", dataForValidate))];
    setErrors(issues);
    if (!issues.length) {
      const linked = getLinkedSkills();
      // Only skills used solely by this competency become drafts; shared skills keep their status.
      onSave({ ...clean, status: "Draft" }, linked.map((s) => compIdsOf(s).length > 1 ? s : { ...s, status: "Draft" as const }));
    }
  }

  function handleFinalSave() {
    const dataForValidate = isEdit
      ? { ...data, competencies: data.competencies.filter((c) => c.id !== clean.id) }
      : data;
    const issues = [
      ...validate(clean, "competencies", dataForValidate),
      ...(!isEdit && selectedSkillIds.length === 0 ? ["Select at least one skill, or save as draft."] : []),
    ];
    const deduped = [...new Set(issues)];
    setErrors(deduped);
    if (deduped.length) return;
    onSave(clean, getLinkedSkills());
  }

  function handleClose() {
    const dirty =
      competency.name.trim() ||
      competency.description.trim() ||
      selectedSkillIds.length > 0;
    if (dirty && !window.confirm("Discard unsaved changes and close?")) return;
    onClose();
  }

  function toggleSkill(id: string) {
    setSelectedSkillIds((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id],
    );
  }

  function getCoursesForLevel(skillId: string, levelId: string) {
    if (!work) return [];
    return work.courses.filter((c) =>
      c.mappings.some((m) => m.skillId === skillId && m.levelId === levelId),
    );
  }

  function toggleLevelExpand(skillId: string, levelId: string) {
    const key = `${skillId}:${levelId}`;
    setExpandedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function toggleMandatory(courseId: string, skillId: string, levelId: string) {
    const key = `${courseId}:${skillId}:${levelId}`;
    const newVal = !(mandatoryMap[key] ?? false);
    setMandatoryMap((prev) => ({ ...prev, [key]: newVal }));
    if (work && onSaveWork) {
      const updatedCourses = work.courses.map((c) =>
        c.id !== courseId ? c : {
          ...c,
          mappings: c.mappings.map((m) =>
            m.skillId !== skillId || m.levelId !== levelId ? m : { ...m, mandatory: newVal },
          ),
        },
      );
      onSaveWork({ ...work, courses: updatedCourses }, "Course settings updated");
    }
  }

  return (
    <section ref={formRef} className="cm-inline-form cm-create-inline">
      <div className="cm-inline-form-head">
        <button type="button" className="cm-text-button cm-inline-back" onClick={handleClose}>
          <ArrowLeft size={15} /> Back to Competency Framework
        </button>
        <h2>{isEdit ? "Edit Competency & Skills" : "Create Competency & Skills"}</h2>
      </div>

      {errors.length > 0 && (
        <div className="cm-error" role="alert" ref={errorRef} tabIndex={-1}>
          {errors.map((e) => <div key={e}>{e}</div>)}
        </div>
      )}

      {/* ── Competency details ── */}
      <div className="cm-config-section">
        <h3>Competency Details</h3>
        <div className="cm-create-step1">
          <label>
            <span className="cm-req-label">Competency Name <span className="req">*</span></span>
            <input
              ref={competencyNameRef}
              aria-label="Competency Name"
              maxLength={120}
              value={competency.name}
              onChange={(e) => setCompetency({ ...competency, name: e.target.value })}
              placeholder="e.g. Communication"
            />
          </label>
          <label>
            <span>Description <span className="cm-field-optional">Optional</span></span>
            <textarea
              value={competency.description}
              onChange={(e) => setCompetency({ ...competency, description: e.target.value })}
              placeholder="What broad capability does this describe?"
              rows={3}
            />
          </label>
        </div>
      </div>

      {/* ── Skill picker ── */}
      <div className="cm-config-section">
        <h3>Skills</h3>

        {availableSkills.length === 0 ? (
          <div className="cm-skill-pick-empty">
            <p>No skills available yet.</p>
            <p>Go to <strong>Library Settings → Skill Master</strong> to create skills first.</p>
          </div>
        ) : (
          <>
            <MultiCheckDropdown
              ariaLabel="Select skills"
              placeholder="Select skills…"
              noun="skill"
              items={availableSkills.map((sk) => {
                const others = compIdsOf(sk).filter((id) => id !== competency.id)
                  .map((id) => data.competencies.find((c) => c.id === id)?.name).filter(Boolean);
                return { id: sk.id, label: sk.name, description: sk.description || undefined, note: others.length ? `Also in: ${others.join(", ")}` : undefined };
              })}
              selectedIds={selectedSkillIds}
              onToggle={toggleSkill}
            />

            {/* ── Selected skill detail cards ── */}
            {selectedSkillIds.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
                {selectedSkillIds.length > 1 && (
                  <div className="cm-skill-expand-bar">
                    <button
                      type="button"
                      className="cm-button"
                      onClick={() => setCollapsedSkills(collapsedSkills.size ? new Set() : new Set(selectedSkillIds))}
                    >
                      {collapsedSkills.size ? "Expand All" : "Collapse All"}
                    </button>
                  </div>
                )}
                {selectedSkillIds.map((id) => {
                  const skill = data.skills.find((s) => s.id === id);
                  if (!skill) return null;
                  const activeLevels = skillLevels(data, skill);
                  // Always list every active level, even when the skill has no description for it.
                  const levelsWithData = activeLevels;

                  return (
                    <div
                      key={id}
                      data-reorder-item
                      className="cm-reorder-card"
                      {...reorder.itemProps(id)}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        background: "#fff",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                        overflow: "hidden",
                      }}
                    >
                      {/* Card header */}
                      <div style={{ padding: "14px 18px 10px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        {selectedSkillIds.length > 1 && <DragHandle {...reorder.handleProps(id, skill.name)} />}
                        <div
                          className="cm-create-skill-toggle"
                          role="button"
                          tabIndex={0}
                          aria-expanded={!collapsedSkills.has(id)}
                          aria-label={`${skill.name} proficiency levels`}
                          onClick={() => toggleSkillCard(id)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSkillCard(id); } }}
                        >
                          <DisclosureIcon open={!collapsedSkills.has(id)} />
                          <div>
                          <strong style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{skill.name}</strong>
                          {skill.description && (
                            <p style={{ margin: "3px 0 0", fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{skill.description}</p>
                          )}
                          {collapsedSkills.has(id) && (
                            <p style={{ margin: "3px 0 0", fontSize: 13, color: "#6b7280" }}>
                              {levelsWithData.length} proficiency level{levelsWithData.length === 1 ? "" : "s"}
                            </p>
                          )}
                          </div>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${skill.name}`}
                          onClick={() => setSelectedSkillIds((ids) => ids.filter((i) => i !== id))}
                          style={{ background: "none", border: "none", padding: "2px 4px", cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center", flexShrink: 0, marginLeft: 8, borderRadius: 4 }}
                        >
                          <X size={15} />
                        </button>
                      </div>

                      {/* Proficiency levels */}
                      {levelsWithData.length > 0 && !collapsedSkills.has(id) && (
                        <div style={{ borderTop: "1px solid #f3f4f6" }}>
                          <div style={{ padding: "8px 18px 4px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9ca3af" }}>
                            Proficiency Levels
                          </div>
                          {levelsWithData.map((l, idx) => {
                            const courses = getCoursesForLevel(skill.id, l.id);
                            return (
                              <div
                                key={l.id}
                                style={{
                                  borderTop: idx > 0 ? "1px solid #f3f4f6" : "none",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 18px" }}>
                                  {/* Numbered circle */}
                                  <span style={{
                                    width: 28, height: 28, borderRadius: "50%",
                                    background: "#1e293b", color: "#fff",
                                    fontSize: 12, fontWeight: 700,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0, marginTop: 2,
                                  }}>
                                    {l.order ?? idx + 1}
                                  </span>
                                  {/* Level name + description */}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <strong style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{l.name}</strong>
                                    <p style={{ margin: "2px 0 0", fontSize: 14, color: "#6b7280", lineHeight: 1.4, fontStyle: skill.levels?.[l.id]?.trim() ? "normal" : "italic" }}>{skill.levels?.[l.id]?.trim() || "No description added"}</p>
                                  </div>
                                  {/* Clickable course count chip */}
                                  {courses.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => toggleLevelExpand(skill.id, l.id)}
                                      style={{
                                        display: "inline-flex", alignItems: "center", gap: 5,
                                        padding: "3px 10px", borderRadius: 20,
                                        border: "1px solid #e5e7eb", background: "#f9fafb",
                                        color: "#6b7280", fontSize: 12, fontWeight: 500,
                                        whiteSpace: "nowrap", flexShrink: 0, cursor: "pointer",
                                      }}
                                    >
                                      <BookOpen size={11} />
                                      {courses.length} course{courses.length > 1 ? "s" : ""}
                                      <ChevronDown size={11} style={{ transform: expandedLevels.has(`${skill.id}:${l.id}`) ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                                    </button>
                                  )}
                                  {courses.length === 0 && (
                                    <span className="cm-no-courses-chip">
                                      <BookOpen size={11} /> No courses mapped
                                    </span>
                                  )}
                                </div>
                                {/* Expanded course panel */}
                                {expandedLevels.has(`${skill.id}:${l.id}`) && (
                                  <div style={{ margin: "0 18px 12px 60px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f9fafb", overflow: "hidden" }}>
                                    {courses.map((c, ci) => (
                                      <div
                                        key={c.id}
                                        style={{
                                          display: "flex", alignItems: "center", justifyContent: "space-between",
                                          padding: "10px 14px",
                                          borderTop: ci > 0 ? "1px solid #e5e7eb" : "none",
                                        }}
                                      >
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                          <BookOpen size={13} color="#6b7280" />
                                          <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{c.name}</span>
                                          {c.duration && (
                                            <span style={{ fontSize: 12, color: "#9ca3af" }}>{c.duration}</span>
                                          )}
                                        </div>
                                        {/* Mandatory toggle */}
                                        <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", userSelect: "none" }}>
                                          <span style={{ fontSize: 12, color: "#6b7280" }}>Mandatory</span>
                                          <span
                                            onClick={() => toggleMandatory(c.id, skill.id, l.id)}
                                            style={{
                                              width: 36, height: 20, borderRadius: 10, display: "inline-flex", alignItems: "center",
                                              background: mandatoryMap[`${c.id}:${skill.id}:${l.id}`] ? "#2463d6" : "#d1d5db",
                                              transition: "background 0.2s", cursor: "pointer", flexShrink: 0, padding: "0 2px",
                                            }}
                                          >
                                            <span style={{
                                              width: 16, height: 16, borderRadius: "50%", background: "#fff",
                                              transform: mandatoryMap[`${c.id}:${skill.id}:${l.id}`] ? "translateX(16px)" : "translateX(0)",
                                              transition: "transform 0.2s", display: "block",
                                              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                                            }} />
                                          </span>
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="cm-inline-form-actions">
        <button type="button" className="cm-button" onClick={handleClose}>
          Cancel
        </button>
        {!isEdit && (
          <button type="button" className="cm-button" onClick={saveDraft}>
            Save as Draft
          </button>
        )}
        <button type="button" className="cm-button primary" onClick={handleFinalSave}>
          {isEdit ? "Save Changes" : "Save"}
        </button>
      </div>
    </section>
  );
}
