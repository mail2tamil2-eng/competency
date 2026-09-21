import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, ArrowRight } from "lucide-react";
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
  useEffect(() => {
    if (errors.length) errorRef.current?.focus();
  }, [errors]);
  const levels = data.levels.filter((l) => l.status === "Active");
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
      const seen = new Set<string>();
      for (const [i, s] of linked.entries()) {
        if (!s.name) issues.push("Skill " + (i + 1) + ": enter a name.");
        if (s.name.length > 120)
          issues.push("Skill " + (i + 1) + ": use 120 characters or fewer.");
        if (
          seen.has(s.name.toLowerCase()) ||
          data.skills.some((x) => x.name.toLowerCase() === s.name.toLowerCase())
        )
          issues.push("Skill " + (i + 1) + ": this skill name already exists.");
        seen.add(s.name.toLowerCase());
        if (stage === 3)
          for (const l of levels)
            if (!s.levels?.[l.id]?.trim())
              issues.push(
                (s.name || "Skill " + (i + 1)) + ": describe " + l.name + ".",
              );
      }
    }
    return [...new Set(issues)];
  }
  function advance() {
    const issues = issuesFor(step);
    setErrors(issues);
    if (!issues.length) setStep(step + 1);
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
      <DialogContent className="cm-dialog cm-wide">
        <DialogHeader>
          <DialogTitle>Create competency & skills</DialogTitle>
          <DialogDescription>
            A competency groups related skills. Define them together, then
            describe what each skill looks like at different levels.
          </DialogDescription>
        </DialogHeader>
        <div className="cm-steps">
          {["Competency", "Skills", "Proficiency"].map((label, i) => (
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
                Each skill is a specific ability that can be learned and
                assessed. Category and competency are already linked for you.
              </p>
              {skills.map((s, i) => (
                <fieldset className="cm-skill-editor" key={s.id}>
                  <legend>Skill {i + 1}</legend>
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
                  <button
                    type="button"
                    className="cm-text-button"
                    aria-label={"Remove skill " + (i + 1)}
                    onClick={() =>
                      setSkills((current) =>
                        current.filter((x) => x.id !== s.id),
                      )
                    }
                  >
                    <Trash2 size={14} />
                    Remove skill
                  </button>
                </fieldset>
              ))}
              <button
                type="button"
                className="cm-button"
                onClick={() =>
                  setSkills((current) => [...current, blankSkill()])
                }
              >
                <Plus size={15} />
                Add another skill
              </button>
              {skills.every((s) => !s.name.trim() && !s.description.trim()) && (
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
              <h3>Define proficiency for each skill</h3>
              <p className="cm-hint">
                Describe an observable ability at each level. These descriptions
                guide learners, managers, and assessments.
              </p>
              {linked.map((s) => (
                <fieldset className="cm-skill-editor" key={s.id}>
                  <legend>{s.name}</legend>
                  {levels.map((l) => (
                    <label key={l.id}>
                      {l.name} *
                      <textarea
                        aria-label={l.name + " for " + s.name}
                        rows={2}
                        value={s.levels?.[l.id] || ""}
                        onChange={(e) =>
                          updateSkill(s.id, {
                            levels: { ...s.levels, [l.id]: e.target.value },
                          })
                        }
                        placeholder={
                          "What can someone at " +
                          l.name.toLowerCase() +
                          " level do?"
                        }
                      />
                    </label>
                  ))}
                </fieldset>
              ))}
              <p className="cm-hint">
                You’re adding 1 competency and {skills.length}{" "}
                {skills.length === 1 ? "skill" : "skills"}. Nothing is saved
                until you finish.
              </p>
            </>
          )}
          <div className="cm-dialog-actions">
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
                  ? "Define proficiency"
                  : "Save to library"}
              {step < 3 && <ArrowRight size={15} />}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
