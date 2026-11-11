import { useState, useEffect, useRef } from "react";
import { ChevronDown, X, BookOpen, Search } from "lucide-react";
import { Data, RecordItem, uid, validate, compIdsOf, withComps, skillLevels } from "./model";
import { WorkflowData } from "./workflowModel";

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [skillSearch, setSkillSearch] = useState("");
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    searchRef.current?.focus();
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    competencyNameRef.current?.focus({ preventScroll: true });
    formRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, []);

  useEffect(() => {
    if (errors.length) errorRef.current?.focus();
  }, [errors]);

  const availableSkills = data.skills.filter((s) => s.status === "Active");

  const filteredSkills = availableSkills.filter(
    (s) => !skillSearch || s.name.toLowerCase().includes(skillSearch.toLowerCase()),
  );

  const clean = {
    ...competency,
    name: competency.name.trim(),
    description: competency.description.trim(),
  };

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
          ← Competency Framework
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
            {/* ── Skill picker trigger ── */}
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <div
                role="combobox"
                aria-expanded={dropdownOpen}
                aria-haspopup="listbox"
                onClick={() => setDropdownOpen((o) => !o)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  minHeight: 38,
                  padding: "10px 12px",
                  border: dropdownOpen ? "1px solid #2d74fa" : "1px solid #dfe2ed",
                  borderRadius: 7,
                  background: "#fff",
                  cursor: "pointer",
                  boxShadow: dropdownOpen ? "0 0 0 3px #2d74fa20" : "none",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                  color: "#424b61",
                  fontSize: 14,
                  fontFamily: "inherit",
                  userSelect: "none",
                }}
              >
                <span style={{ color: selectedSkillIds.length === 0 ? "#9ca3af" : "#424b61" }}>
                  {selectedSkillIds.length === 0
                    ? "Select skills…"
                    : selectedSkillIds.length === 1
                      ? (data.skills.find((s) => s.id === selectedSkillIds[0])?.name ?? "1 skill selected")
                      : `${selectedSkillIds.length} skills selected`}
                </span>
                <ChevronDown
                  size={16}
                  style={{
                    color: "#9ca3af",
                    flexShrink: 0,
                    transform: dropdownOpen ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s",
                  }}
                />
              </div>

              {/* ── Dropdown panel ── */}
              {dropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    right: 0,
                    background: "#f8fafc",
                    border: "1px solid #e8edf4",
                    borderRadius: 10,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                    zIndex: 200,
                    overflow: "hidden",
                  }}
                >
                  {/* Search */}
                  <div style={{ padding: "10px 12px", borderBottom: "1px solid #e8edf4", display: "flex", alignItems: "center", gap: 8, background: "#fff" }}>
                    <Search size={14} style={{ color: "#526176", flexShrink: 0 }} />
                    <input
                      ref={searchRef}
                      type="text"
                      placeholder="Search skills…"
                      value={skillSearch}
                      onChange={(e) => setSkillSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        border: "none",
                        outline: "none",
                        fontSize: 14,
                        width: "100%",
                        background: "transparent",
                        color: "#424b61",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>

                  {/* Options */}
                  <div style={{ maxHeight: 220, overflowY: "auto", background: "#fff" }}>
                    {filteredSkills.length === 0 ? (
                      <div style={{ padding: "12px 14px", fontSize: 14, color: "#9ca3af" }}>No skills match your search.</div>
                    ) : filteredSkills.map((s) => {
                      const isSelected = selectedSkillIds.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 10,
                            padding: "10px 14px",
                            cursor: "pointer",
                            background: isSelected ? "#eef3fb" : "transparent",
                            borderBottom: "1px solid #f0f2f7",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSkill(s.id)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ marginTop: 3, accentColor: "#2463d6", width: 15, height: 15, flexShrink: 0, cursor: "pointer" }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: "#263047", display: "block" }}>{s.name}</span>
                            {s.description && (
                              <span style={{ fontSize: 14, color: "#526176", display: "block", marginTop: 2 }}>{s.description}</span>
                            )}
                            {(() => {
                              const others = compIdsOf(s).filter((id) => id !== competency.id)
                                .map((id) => data.competencies.find((c) => c.id === id)?.name).filter(Boolean);
                              return others.length ? (
                                <span className="cm-also-in">Also in: {others.join(", ")}</span>
                              ) : null;
                            })()}
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div style={{ padding: "10px 14px", borderTop: "1px solid #e8edf4", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc" }}>
                    <span style={{ fontSize: 13, color: "#526176" }}>
                      {selectedSkillIds.length} selected
                    </span>
                    <button
                      type="button"
                      className="cm-button primary"
                      onClick={() => { setDropdownOpen(false); setSkillSearch(""); }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Selected chips ── */}
            {selectedSkillIds.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {selectedSkillIds.map((id) => {
                  const s = data.skills.find((sk) => sk.id === id);
                  return s ? (
                    <span
                      key={id}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        background: "#eef3fb",
                        color: "#1a56db",
                        border: "1px solid #c7d8f7",
                        borderRadius: 6,
                        padding: "3px 10px",
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: "inherit",
                      }}
                    >
                      {s.name}
                      <button
                        type="button"
                        onClick={() => toggleSkill(id)}
                        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "#4b7bec", lineHeight: 1, display: "flex" }}
                        aria-label={`Remove ${s.name}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}

            {/* ── Selected skill detail cards ── */}
            {selectedSkillIds.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
                {selectedSkillIds.map((id) => {
                  const skill = data.skills.find((s) => s.id === id);
                  if (!skill) return null;
                  const activeLevels = skillLevels(data, skill);
                  // Always list every active level, even when the skill has no description for it.
                  const levelsWithData = activeLevels;

                  return (
                    <div
                      key={id}
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
                        <div>
                          <strong style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{skill.name}</strong>
                          {skill.description && (
                            <p style={{ margin: "3px 0 0", fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{skill.description}</p>
                          )}
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
                      {levelsWithData.length > 0 && (
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
      <div className="cm-inline-form-actions" style={{ borderTop: "1px solid #e5e7eb", paddingTop: 16 }}>
        <button type="button" className="cm-button" onClick={handleClose}>
          Cancel
        </button>
        {!isEdit && selectedSkillIds.length > 0 && (
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
