import { useState } from "react";
import { Data, Kind, RecordItem, uid, validate } from "./model";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
export function Editor({
  kind,
  data,
  item,
  parent,
  onClose,
  onSave,
}: {
  kind: Kind;
  data: Data;
  item?: RecordItem;
  parent?: RecordItem;
  onClose: () => void;
  onSave: (item: RecordItem) => void;
}) {
  const [draft, setDraft] = useState<RecordItem>(
    item
      ? structuredClone(item)
      : {
          id: uid(),
          name: "",
          description: "",
          status: "Active",
          levels: {},
          categoryId: parent?.categoryId,
          competencyId: parent?.id,
        },
  );
  const [errors, setErrors] = useState<string[]>([]);
  const singular = {
    categories: "category",
    levels: "level",
    competencies: "competency",
    skills: "skill",
  }[kind];
  const set = (field: string, value: string) =>
    setDraft((d) => ({
      ...d,
      [field]: value,
      ...(field === "categoryId" ? { competencyId: "" } : {}),
    }));
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="cm-dialog">
        <DialogHeader>
          <DialogTitle>
            {item ? "Edit" : "Create"} {singular}
          </DialogTitle>
          <DialogDescription>
            {kind === "skills"
              ? "Describe the skill at each proficiency level so expectations are clear."
              : "Give your team a clear name and description."}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const next = {
              ...draft,
              name: draft.name.trim(),
              description: draft.description.trim(),
            };
            const issues = validate(next, kind, data);
            setErrors(issues);
            if (!issues.length) onSave(next);
          }}
        >
          {errors.length > 0 && (
            <div className="cm-error" role="alert">
              {errors.map((x) => (
                <div key={x}>{x}</div>
              ))}
            </div>
          )}
          <label>
            Name <span>*</span>
            <input
              autoFocus
              required
              maxLength={120}
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder={"Enter " + singular + " name"}
            />
          </label>
          <label>
            Description
            <textarea
              rows={3}
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What does this help your team achieve?"
            />
          </label>
          {parent && (
            <div className="cm-hint">
              <strong>Skill in {parent.name}</strong>
              <br />
              Category and competency are already linked. Define the skill
              below.
            </div>
          )}
          {!parent && (kind === "competencies" || kind === "skills") && (
            <label>
              Category <span>*</span>
              <select
                required
                value={draft.categoryId || ""}
                onChange={(e) => set("categoryId", e.target.value)}
              >
                <option value="">Select a category</option>
                {data.categories
                  .filter((x) => x.status === "Active")
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {kind === "skills" && (
            <>
              {!parent && (
                <p className="cm-hint">
                  Choose a competency from the library to add a skill.
                </p>
              )}
              <h3>Proficiency expectations</h3>
              {data.levels
                .filter((x) => x.status === "Active")
                .map((l) => (
                  <label key={l.id}>
                    {l.name} <span>*</span>
                    <textarea
                      required
                      rows={2}
                      placeholder={
                        "What does " +
                        l.name.toLowerCase() +
                        " look like for this skill?"
                      }
                      value={draft.levels?.[l.id] || ""}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          levels: { ...d.levels, [l.id]: e.target.value },
                        }))
                      }
                    />
                  </label>
                ))}
            </>
          )}
          <label>
            Status
            <select
              value={draft.status}
              onChange={(e) => set("status", e.target.value)}
            >
              <option>Active</option>
              <option>Inactive</option>
              {kind === "competencies" && <option>Draft</option>}
            </select>
          </label>
          <div className="cm-dialog-actions">
            <button type="button" className="cm-button" onClick={onClose}>
              Cancel
            </button>
            <button className="cm-button primary" type="submit">
              Save {singular}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
