import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { Data, RecordItem, uid, validate } from "./model";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
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
}: {
  data: Data;
  onClose: () => void;
  onSave: (competency: RecordItem, skills: RecordItem[]) => void;
}) {
  const [step, setStep] = useState(1),
    [competency, setCompetency] = useState<RecordItem>({
      id: uid(),
      name: "",
      description: "",
      categoryId: "",
      status: "Active",
    }),
    [skills, setSkills] = useState<RecordItem[]>([blankSkill()]),
    [errors, setErrors] = useState<string[]>([]);
  const errorRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<string | null>(skills[0].id);
  useEffect(() => {
    if (errors.length) errorRef.current?.focus();
  }, [errors]);
  const levels = data.levels.filter((l) => l.status === "Active");
  const completedLevels = (s: RecordItem) =>
    levels.filter((l) => s.levels?.[l.id]?.trim()).length;
  const skillIssues = (s: RecordItem, i: number, proficiency = true) => {
    const issues: string[] = [];
    const name = s.name.trim();
    const label = name || `Skill ${i + 1}`;
    if (!name) issues.push(`Skill ${i + 1}: enter a name.`);
    if (name.length > 120)
      issues.push(`${label}: use 120 characters or fewer.`);
    if (
      name &&
      (skills.some(
        (x) =>
          x.id !== s.id && x.name.trim().toLowerCase() === name.toLowerCase(),
      ) ||
        data.skills.some(
          (x) => x.name.trim().toLowerCase() === name.toLowerCase(),
        ))
    )
      issues.push(`${label}: this skill name already exists.`);
    if (proficiency)
      for (const l of levels)
        if (!s.levels?.[l.id]?.trim())
          issues.push(`${label}: describe ${l.name}.`);
    return issues;
  };
  const completeCount = skills.filter(
    (s, i) => !skillIssues(s, i).length,
  ).length;
  const linked = skills.map((s) => ({
    ...s,
    name: s.name.trim(),
    description: s.description.trim(),
    categoryId: competency.categoryId,
    competencyId: competency.id,
  }));
  const clean = {
    ...competency,
    name: competency.name.trim(),
    description: competency.description.trim(),
  };
  function issuesFor(stage: number) {
    const issues = validate(clean, "competencies", data);
    if (stage >= 2) {
      if (!linked.length)
        issues.push(
          "Add at least one skill, or save an empty competency as a draft.",
        );
      for (const [i, s] of linked.entries()) {
        issues.push(...skillIssues(s, i));
      }
    }
    return [...new Set(issues)];
  }
  function advance() {
    const issues = issuesFor(step);
    setErrors(issues);
    if (!issues.length) setStep(step + 1);
    else if (step === 2)
      setExpanded(skills.find((s, i) => skillIssues(s, i).length)?.id || null);
  }
  function updateSkill(id: string, patch: Partial<RecordItem>) {
    setSkills((current) =>
      current.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="cm-dialog cm-wide cm-create-dialog">
        <DialogHeader>
          <DialogTitle>Create competency & skills</DialogTitle>
          <DialogDescription>
            Add each skill together with its proficiency descriptions, then
            review before saving.
          </DialogDescription>
        </DialogHeader>
        <div className="cm-steps">
          {["Competency", "Skills & proficiency", "Review"].map((label, i) => (
            <span key={label} className={step >= i + 1 ? "active" : ""}>
              {i + 1} · {label}
            </span>
          ))}
        </div>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (step < 3) {
              advance();
              return;
            }
            const issues = issuesFor(3);
            setErrors(issues);
            if (!issues.length) onSave(clean, linked);
          }}
        >
          {errors.length > 0 && (
            <div className="cm-error" role="alert" ref={errorRef} tabIndex={-1}>
              {errors.map((e) => (
                <div key={e}>{e}</div>
              ))}
            </div>
          )}
          {step === 1 && (
            <>
              <label>
                Competency name *
                <input
                  autoFocus
                  aria-label="Competency name"
                  maxLength={120}
                  value={competency.name}
                  onChange={(e) =>
                    setCompetency({ ...competency, name: e.target.value })
                  }
                  placeholder="e.g. Communication"
                />
              </label>
              <label>
                Description
                <textarea
                  value={competency.description}
                  onChange={(e) =>
                    setCompetency({
                      ...competency,
                      description: e.target.value,
                    })
                  }
                  placeholder="What broad capability does this describe?"
                  rows={3}
                />
              </label>
              <label>
                Category *
                <select
                  aria-label="Category"
                  value={competency.categoryId}
                  onChange={(e) =>
                    setCompetency({ ...competency, categoryId: e.target.value })
                  }
                >
                  <option value="">Select a category</option>
                  {data.categories
                    .filter((c) => c.status === "Active")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </label>
              <p className="cm-hint">
                For example, Communication contains skills such as Active
                Listening and Public Speaking. Manage categories under Library
                settings.
              </p>
            </>
          )}
          {step === 2 && (
            <>
              <h3>Which skills belong in {competency.name}?</h3>
              <p className="cm-hint">
                Complete one skill at a time. Describe what someone can do at
                each proficiency level before adding the next skill.
              </p>
              <p className="cm-skill-progress" role="status">
                {skills.length} skills · {completeCount} complete ·{" "}
                {skills.length - completeCount} need attention
              </p>
              {skills.map((s, i) => (
                <section className="cm-create-skill" key={s.id}>
                  <button
                    type="button"
                    className="cm-create-skill-toggle"
                    aria-expanded={expanded === s.id}
                    aria-controls={`skill-panel-${s.id}`}
                    onClick={() => {
                      setExpanded(expanded === s.id ? null : s.id);
                      setErrors([]);
                    }}
                  >
                    <span className="cm-create-skill-number">
                      {!skillIssues(s, i).length ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span>
                      <strong>{s.name.trim() || `Skill ${i + 1}`}</strong>
                      <small>
                        {completedLevels(s)}/{levels.length} levels completed
                        {skillIssues(s, i).length
                          ? " · Needs attention"
                          : " · Complete"}
                      </small>
                    </span>
                    <ChevronDown
                      size={18}
                      className={expanded === s.id ? "cm-rotated" : ""}
                    />
                  </button>
                  {expanded === s.id && (
                    <div
                      id={`skill-panel-${s.id}`}
                      className="cm-create-skill-body"
                    >
                      <label>
                        Skill name *
                        <input
                          aria-label={"Skill " + (i + 1) + " name"}
                          value={s.name}
                          maxLength={120}
                          onChange={(e) =>
                            updateSkill(s.id, { name: e.target.value })
                          }
                          placeholder="e.g. Active Listening"
                        />
                      </label>
                      <label>
                        Description
                        <textarea
                          aria-label={"Skill " + (i + 1) + " description"}
                          rows={2}
                          value={s.description}
                          onChange={(e) =>
                            updateSkill(s.id, { description: e.target.value })
                          }
                          placeholder="What will the learner be able to do?"
                        />
                      </label>
                      <div className="cm-proficiency-heading">
                        <h3>
                          Proficiency for {s.name.trim() || `Skill ${i + 1}`}
                        </h3>
                        <p>Use observable actions to make each level clear.</p>
                      </div>
                      <div className="cm-proficiency-fields">
                        {levels.map((l) => (
                          <label key={l.id}>
                            {l.name} *
                            <textarea
                              aria-label={
                                l.name +
                                " for " +
                                (s.name.trim() || `Skill ${i + 1}`)
                              }
                              rows={2}
                              value={s.levels?.[l.id] || ""}
                              onChange={(e) =>
                                updateSkill(s.id, {
                                  levels: {
                                    ...s.levels,
                                    [l.id]: e.target.value,
                                  },
                                })
                              }
                              placeholder={`What can someone at ${l.name.toLowerCase()} level do?`}
                            />
                          </label>
                        ))}
                      </div>
                      {!levels.length && (
                        <p className="cm-hint">
                          No active proficiency levels. You can manage levels in
                          Library settings.
                        </p>
                      )}
                      <div className="cm-create-skill-actions">
                        <button
                          type="button"
                          className="cm-text-button"
                          aria-label={"Remove skill " + (i + 1)}
                          onClick={() => {
                            setSkills((current) =>
                              current.filter((x) => x.id !== s.id),
                            );
                            setExpanded(
                              skills[i + 1]?.id || skills[i - 1]?.id || null,
                            );
                            setErrors([]);
                          }}
                        >
                          <Trash2 size={14} />
                          Remove skill
                        </button>
                        <button
                          type="button"
                          className="cm-button primary"
                          onClick={() => {
                            const issues = skillIssues(s, i);
                            setErrors(issues);
                            if (!issues.length) setExpanded(null);
                          }}
                        >
                          Done with this skill <CheckCircle2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              ))}
              <button
                type="button"
                className="cm-button"
                onClick={() => {
                  const next = blankSkill();
                  setSkills((current) => [...current, next]);
                  setExpanded(next.id);
                  setErrors([]);
                }}
              >
                <Plus size={15} />
                Add another skill
              </button>
              {skills.every(
                (s) =>
                  !s.name.trim() &&
                  !s.description.trim() &&
                  !Object.values(s.levels || {}).some((v) => v.trim()),
              ) && (
                <button
                  type="button"
                  className="cm-text-button cm-save-draft"
                  onClick={() => {
                    const issues = issuesFor(1);
                    setErrors(issues);
                    if (!issues.length)
                      onSave({ ...clean, status: "Draft" }, []);
                  }}
                >
                  I’ll add skills later — save as draft
                </button>
              )}
            </>
          )}
          {step === 3 && (
            <>
              <h3>Review {competency.name}</h3>
              <p className="cm-hint">
                {
                  data.categories.find((c) => c.id === competency.categoryId)
                    ?.name
                }{" "}
                · {skills.length} skills ready to save. Expand a skill to check
                its descriptions.
              </p>
              {linked.map((s) => (
                <details className="cm-create-review" key={s.id}>
                  <summary>
                    {s.name}
                    <span>
                      {completedLevels(s)}/{levels.length} levels completed
                    </span>
                  </summary>
                  {s.description && <p>{s.description}</p>}
                  {levels.map((l) => (
                    <div className="cm-review-level" key={l.id}>
                      <strong>{l.name}</strong>
                      <p>{s.levels?.[l.id]}</p>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="cm-text-button"
                    onClick={() => {
                      setStep(2);
                      setExpanded(s.id);
                      setErrors([]);
                    }}
                  >
                    Edit {s.name}
                  </button>
                </details>
              ))}
              <p className="cm-hint">
                You’re adding 1 competency and {skills.length}{" "}
                {skills.length === 1 ? "skill" : "skills"}. Nothing is saved
                until you finish.
              </p>
            </>
          )}
          <div className="cm-dialog-actions">
            {skills.some(
              (s) =>
                s.name.trim() ||
                s.description.trim() ||
                Object.values(s.levels || {}).some((v) => v.trim()),
            ) &&
              step > 1 && (
                <button
                  type="button"
                  className="cm-button"
                  onClick={() => {
                    const kept = linked.filter(
                      (s) =>
                        s.name ||
                        s.description ||
                        Object.values(s.levels || {}).some((v) => v.trim()),
                    );
                    const issues = [
                      ...issuesFor(1),
                      ...kept.flatMap((s) =>
                        skillIssues(
                          s,
                          skills.findIndex((x) => x.id === s.id),
                          false,
                        ),
                      ),
                    ];
                    setErrors(issues);
                    if (!issues.length)
                      onSave(
                        { ...clean, status: "Draft" },
                        kept.map((s) => ({ ...s, status: "Draft" })),
                      );
                  }}
                >
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
                ? "Continue to skills"
                : step === 2
                  ? "Review competency"
                  : "Save to library"}
              {step < 3 && <ArrowRight size={15} />}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
