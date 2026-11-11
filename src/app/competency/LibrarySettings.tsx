import { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Ban, CheckCircle2, ArrowLeft, Upload } from "lucide-react";
import { Data, RecordItem, uid, used, compIdsOf, validate } from "./model";
import { WorkflowData } from "./workflowModel";
import { SkillInlineEdit } from "./CompetencyLibrary";
import { SkillBulkUpload } from "./SkillBulkUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";

type Section = "levels" | "skills";

/** Competencies a skill belongs to. */
export function skillCompetencies(data: Data, skill: RecordItem): RecordItem[] {
  const ids = compIdsOf(skill);
  return data.competencies.filter((c) => ids.includes(c.id));
}
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
/** "A, B, C and 4 more" */
function names(list: string[], max = 3) {
  if (list.length <= max) return list.join(", ");
  return `${list.slice(0, max).join(", ")} and ${list.length - max} more`;
}

/** One wording pattern for every Library Settings section. */
function blockedTitle(section: Section, name: string, verb: "inactivated" | "deleted") {
  const where =
    section === "levels"
      ? "a skill, role, course, or learner usage"
      : "a course, assignment, or learner usage";
  return `${name} is mapped to ${where} and cannot be ${verb}.`;
}

/** Where an item is used, listed in the confirmation so admins know what to change. */
function usageItems(data: Data, section: Section, id: string): string[] {
  const courses = data.workflow?.courses ?? [],
    plans = data.workflow?.plans ?? [];
  const row = (label: string, list: string[]) => list.length ? `${label} (${list.length}): ${names(list)}` : "";
  if (section === "levels") {
    const learners = data.assignments.filter((a) => a.current === id || a.expected === id).length;
    return [
      row("Skills", data.skills.filter((s) => Object.hasOwn(s.levels || {}, id)).map((s) => s.name)),
      row("Courses", courses.filter((c) => c.mappings.some((m) => m.levelId === id)).map((c) => c.name)),
      row("Assignment plans", plans.filter((p) => p.skills.some((s) => s.expected === id)).map((p) => p.name)),
      learners ? `Learners: ${plural(learners, "learner")}` : "",
    ].filter(Boolean);
  }
  const skill = data.skills.find((s) => s.id === id);
  const learners = data.assignments.filter((a) => a.skillId === id).length;
  return [
    row("Competencies", skill ? skillCompetencies(data, skill).map((c) => c.name) : []),
    row("Courses", courses.filter((c) => c.mappings.some((m) => m.skillId === id)).map((c) => c.name)),
    row("Assignment plans", plans.filter((p) => p.skills.some((s) => s.skillId === id)).map((p) => p.name)),
    learners ? `Learners: ${plural(learners, "learner")}` : "",
  ].filter(Boolean);
}

/** Shared inactivate/delete confirmation used by Proficiency Levels and Skill Master. */
function ConfirmDialog({
  action, name, blocked, blockedTitle, note, usage, onClose, onConfirm,
}: {
  action: "inactivate" | "delete";
  name: string;
  blocked: boolean;
  blockedTitle: string;
  note?: string;
  usage: string[];
  onClose: () => void;
  onConfirm: () => void;
}) {
  const title = blocked ? blockedTitle : `Are you sure you want to ${action} ${name}?`;
  const description = blocked
    ? action === "inactivate"
      ? "Remove these mappings first, then try again."
      : "Remove these mappings first, or inactivate it instead."
    : action === "inactivate"
      ? `${note ? note + " " : ""}You can activate it again at any time.`
      : `${note ? note + " " : ""}This action cannot be undone.`;
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="cm-dialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {usage.length > 0 && (
          <ul className="cm-usage-list" aria-label="Where it is used">
            {usage.map((t) => <li key={t}>{t}</li>)}
          </ul>
        )}
        <div className="cm-dialog-actions">
          <button className="cm-button" onClick={onClose}>{blocked ? "Close" : "Cancel"}</button>
          {!blocked && (
            <button className="cm-button destructive" onClick={onConfirm}>
              {action === "inactivate" ? "Inactivate" : "Delete"}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Competency count shown as a number only. */
function CompetencyCell({ comps }: { comps: RecordItem[] }) {
  return <span className={"cm-comp-count" + (comps.length ? "" : " zero")}>{comps.length}</span>;
}

/** Full-page create/edit form for a proficiency level (order is set automatically). */
function LevelForm({
  data,
  item,
  onCancel,
  onSave,
}: {
  data: Data;
  item?: RecordItem;
  onCancel: () => void;
  onSave: (item: RecordItem) => void;
}) {
  const [draft, setDraft] = useState<RecordItem>(
    () => (item ? structuredClone(item) : { id: uid(), name: "", description: "", status: "Active" }),
  );
  const [errors, setErrors] = useState<string[]>([]);
  function save() {
    const next = { ...draft, name: draft.name.trim(), description: draft.description.trim() };
    const issues = validate(next, "levels", data);
    setErrors(issues);
    if (!issues.length) onSave(next);
  }
  return (
    <form className="cm-level-form" onSubmit={(e) => { e.preventDefault(); save(); }}>
      {errors.length > 0 && (
        <div className="cm-error" role="alert">
          {errors.map((e) => <div key={e}>{e}</div>)}
        </div>
      )}
      <label>
        <span className="cm-req-label">Level Name <span className="req">*</span></span>
        <input
          autoFocus
          maxLength={120}
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="e.g. Proficient"
        />
      </label>
      <label>
        <span>Description <span className="cm-field-optional">Optional</span></span>
        <textarea
          rows={3}
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          placeholder="What does someone at this level typically do?"
        />
      </label>
      <div className="cm-inline-form-actions">
        <button type="button" className="cm-button" onClick={onCancel}>Cancel</button>
        <button type="submit" className="cm-button primary">{item ? "Save Changes" : "Save Level"}</button>
      </div>
    </form>
  );
}

export function LibrarySettings({
  data,
  initialSection,
  commit,
  work,
  onSaveWork,
}: {
  data: Data;
  initialSection: Section;
  commit: (data: Data, message: string) => boolean;
  work?: WorkflowData;
  onSaveWork?: (work: WorkflowData, msg: string) => boolean;
}) {
  const [section, setSection] = useState<Section>(initialSection),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [editing, setEditing] = useState<{ item?: RecordItem } | null>(null),
    [deleting, setDeleting] = useState<RecordItem | null>(null),
    [inactivating, setInactivating] = useState<RecordItem | null>(null);

  /* ── Skill Master state ── */
  const [skillView, setSkillView] = useState<"list" | "create" | string>("list");
  const [skillDeleting, setSkillDeleting] = useState<RecordItem | null>(null);
  const [skillInactivating, setSkillInactivating] = useState<RecordItem | null>(null);
  const [skillUploading, setSkillUploading] = useState(false);

  function applyLevelOrder(allLevels: RecordItem[], newItem: RecordItem, isNew: boolean): RecordItem[] {
    const maxPos = isNew ? allLevels.length + 1 : allLevels.length;
    const targetPos = Math.max(1, Math.min(maxPos, newItem.order ?? maxPos));
    const others = isNew ? allLevels : allLevels.filter((l) => l.id !== newItem.id);
    const sorted = [...others].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    sorted.splice(targetPos - 1, 0, newItem);
    return sorted.map((l, i) => ({ ...l, order: i + 1 }));
  }
  useEffect(() => {
    setSection(initialSection);
    setQuery("");
    setSkillView("list");
    setEditing(null);
  }, [initialSection]);

  const records = (section === "skills" ? [] : data.levels)
    .filter(
      (x) =>
        (x.name + " " + x.description)
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (!status || x.status === status),
    )
    .sort((a, b) =>
      section === "levels" ? (a.order ?? 999) - (b.order ?? 999) : 0,
    );

  const skillRecords = section === "skills"
    ? data.skills.filter(
        (s) =>
          (s.name + " " + (s.description ?? "")).toLowerCase().includes(query.toLowerCase()) &&
          (!status || s.status === status),
      )
    : [];

  /* ── Skill Master: create/edit view ── */
  /* ── Proficiency level: create/edit page ── */
  if (section === "levels" && editing) {
    return (
      <section className="cm-card">
        <div className="cm-section-head">
          <div>
            <h2>Library Settings</h2>
            <p>Manage proficiency levels and skills used across your competency framework.</p>
          </div>
        </div>
        <div className="cm-skill-master-view">
          <button type="button" className="cm-text-button" onClick={() => setEditing(null)}>
            <ArrowLeft size={15} /> Back to Proficiency Levels
          </button>
          <h3 style={{ marginTop: 16 }}>{editing.item ? `Edit: ${editing.item.name}` : "New Level"}</h3>
          <LevelForm
            data={data}
            item={editing.item}
            onCancel={() => setEditing(null)}
            onSave={(item) => {
              const isNew = !editing.item;
              const nextData = { ...data, levels: applyLevelOrder(data.levels, item, isNew) };
              if (commit(nextData, isNew ? `Level "${item.name}" created` : `Level "${item.name}" saved`)) setEditing(null);
            }}
          />
        </div>
      </section>
    );
  }

  if (section === "skills" && skillView !== "list") {
    const isCreating = skillView === "create";
    const existing = isCreating ? null : data.skills.find((s) => s.id === skillView) ?? null;
    const draft: RecordItem = existing
      ? structuredClone(existing)
      : { id: uid(), name: "", description: "", status: "Active", levels: {} };
    return (
      <section className="cm-card">
        <div className="cm-section-head">
          <div>
            <h2>Library Settings</h2>
            <p>Manage proficiency levels and skills used across your competency framework.</p>
          </div>
        </div>
        <div className="cm-skill-master-view">
          <button type="button" className="cm-text-button" onClick={() => setSkillView("list")}>
            <ArrowLeft size={15} /> Back to Skill Master
          </button>
          <h3 style={{ marginTop: 16 }}>{isCreating ? "New Skill" : `Edit: ${existing?.name}`}</h3>
          <SkillInlineEdit
            showMandatory={false}
            requireCourse
            skill={draft}
            data={data}
            work={work}
            onSaveWork={onSaveWork}
            onCancel={() => setSkillView("list")}
            onSave={(saved, nextWork) => {
              const isNew = !data.skills.some((s) => s.id === saved.id);
              if (
                commit(
                  {
                    ...data,
                    skills: isNew ? [...data.skills, saved] : data.skills.map((s) => (s.id === saved.id ? saved : s)),
                    ...(nextWork ? { workflow: nextWork } : {}),
                  },
                  isNew ? `Skill "${saved.name}" created` : `Skill "${saved.name}" saved`,
                )
              )
                setSkillView("list");
            }}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="cm-card">
      <div className="cm-section-head">
        <div>
          <h2>Library Settings</h2>
          <p>Manage proficiency levels and skills used across your competency framework.</p>
        </div>
        <div className="cm-settings-tabs-bar">
          <div
            className="cm-settings-tabs"
            role="group"
            aria-label="Library Settings Sections"
          >
            {(["levels", "skills"] as const).map((s) => (
              <button
                className={section === s ? "active" : ""}
                aria-pressed={section === s}
                key={s}
                onClick={() => {
                  setSection(s);
                  setQuery("");
                  setStatus("");
                  setSkillView("list");
                  setEditing(null);
                }}
              >
                {s === "levels" ? "Proficiency Levels" : "Skill Master"}
                <span className="cm-tab-count">{s === "skills" ? data.skills.length : data.levels.length}</span>
              </button>
            ))}
          </div>
          {section !== "skills" ? (
            <button className="cm-button primary" onClick={() => setEditing({})}>
              <Plus size={16} />
              Add Level
            </button>
          ) : (
            <div className="cm-head-actions">
              <button className="cm-button" onClick={() => setSkillUploading(true)}>
                <Upload size={16} /> Bulk Upload
              </button>
              <button className="cm-button primary" onClick={() => setSkillView("create")}>
                <Plus size={16} /> Add Skill
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="cm-toolbar">
        <label className="cm-search">
          <Search size={17} />
          <input
            aria-label="Search Library Settings"
            placeholder={"Search " + section + "…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Filter Settings Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>
      {section === "skills" ? (
        <>
          <div className="cm-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>Competency Count</th>
                  <th>Status</th>
                  <th className="cm-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {skillRecords.map((s) => {
                  return (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.name}</strong>
                        <small>{s.description || "No description added"}</small>
                      </td>
                      <td><CompetencyCell comps={skillCompetencies(data, s)} /></td>
                      <td><span className={"cm-badge " + s.status.toLowerCase()}>{s.status}</span></td>
                      <td>
                        <div className="cm-row-actions">
                          <button className="cm-icon-button" aria-label={"Edit " + s.name} onClick={() => setSkillView(s.id)}>
                            <Pencil size={16} />
                          </button>
                          {s.status === "Active" ? (
                            <button className="cm-icon-button" aria-label={"Inactivate " + s.name} title="Inactivate"
                              onClick={() => setSkillInactivating(s)}>
                              <Ban size={16} />
                            </button>
                          ) : (
                            <button className="cm-icon-button" aria-label={"Activate " + s.name} title="Activate"
                              onClick={() => commit({ ...data, skills: data.skills.map((x) => x.id === s.id ? { ...x, status: "Active" as const } : x) }, `${s.name} activated`)}>
                              <CheckCircle2 size={16} />
                            </button>
                          )}
                          <button className="cm-icon-button danger" aria-label={"Delete " + s.name}
                            onClick={() => setSkillDeleting(s)}>
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
          {!skillRecords.length && (
            <p className="cm-empty">
              {data.skills.length === 0
                ? "No skills yet. Click Add Skill to create your first skill."
                : "No matching skills. Try another search."}
            </p>
          )}
          {skillUploading && (
            <SkillBulkUpload
              data={data}
              courses={work?.courses ?? data.workflow?.courses ?? []}
              onClose={() => setSkillUploading(false)}
              onImport={(result) => {
                const baseWork = data.workflow ?? work;
                const courses = (baseWork?.courses ?? []).map((c) => {
                  const add = result.mappings.filter((m) => m.courseId === c.id).map(({ skillId, levelId }) => ({ skillId, levelId }));
                  return add.length ? { ...c, mappings: [...c.mappings, ...add] } : c;
                });
                const next = { ...data, skills: [...data.skills, ...result.skills], ...(baseWork ? { workflow: { ...baseWork, courses } } : {}) };
                const msg = `${plural(result.skills.length, "skill")} imported` + (result.mappings.length ? ` with ${plural(result.mappings.length, "course mapping")}` : "");
                if (commit(next, msg)) setSkillUploading(false);
              }}
            />
          )}
          {skillInactivating && (
            <ConfirmDialog
              action="inactivate"
              name={skillInactivating.name}
              blockedTitle={blockedTitle("skills", skillInactivating.name, "inactivated")}
              blocked={used(data, "skills", skillInactivating.id)}
              note="It will no longer be available when creating competencies and assignments."
              usage={usageItems(data, "skills", skillInactivating.id)}
              onClose={() => setSkillInactivating(null)}
              onConfirm={() => {
                if (commit({ ...data, skills: data.skills.map((x) => x.id === skillInactivating.id ? { ...x, status: "Inactive" as const } : x) }, `${skillInactivating.name} inactivated`))
                  setSkillInactivating(null);
              }}
            />
          )}
          {skillDeleting && (
            <ConfirmDialog
              action="delete"
              name={skillDeleting.name}
              blockedTitle={blockedTitle("skills", skillDeleting.name, "deleted")}
              blocked={used(data, "skills", skillDeleting.id)}
              note={skillCompetencies(data, skillDeleting).length ? `It will also be removed from ${names(skillCompetencies(data, skillDeleting).map((c) => c.name))}.` : undefined}
              usage={usageItems(data, "skills", skillDeleting.id)}
              onClose={() => setSkillDeleting(null)}
              onConfirm={() => {
                if (commit({ ...data, skills: data.skills.filter((x) => x.id !== skillDeleting.id) }, `${skillDeleting.name} deleted`))
                  setSkillDeleting(null);
              }}
            />
          )}
        </>
      ) : (
        <>
          <div className="cm-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  {section === "levels" && <th style={{ width: 80 }}>Order</th>}
                  <th className="cm-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.name}</strong>
                      <small>{r.description || "No description added"}</small>
                    </td>
                    <td>
                      <span className={"cm-badge " + r.status.toLowerCase()}>{r.status}</span>
                    </td>
                    {section === "levels" && (
                      <td style={{ color: "#526176", fontSize: 14 }}>{r.order ?? "—"}</td>
                    )}
                    <td>
                      <div className="cm-row-actions">
                        <button className="cm-icon-button" aria-label={"Edit " + r.name} onClick={() => setEditing({ item: r })}>
                          <Pencil size={16} />
                        </button>
                        {r.status === "Active" ? (
                          <button className="cm-icon-button" aria-label={"Inactivate " + r.name} title="Inactivate"
                            onClick={() => setInactivating(r)}>
                            <Ban size={16} />
                          </button>
                        ) : (
                          <button className="cm-icon-button" aria-label={"Activate " + r.name} title="Activate"
                            onClick={() => commit({ ...data, [section]: (data as any)[section].map((x: RecordItem) => x.id === r.id ? { ...x, status: "Active" } : x) }, `${r.name} activated`)}>
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        <button className="cm-icon-button danger" aria-label={"Delete " + r.name} onClick={() => setDeleting(r)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!records.length && (
            <p className="cm-empty">
              No matching {section}. Try another search or add an item.
            </p>
          )}
        </>
      )}
      {inactivating && section !== "skills" && (
        <ConfirmDialog
          action="inactivate"
          name={inactivating.name}
          blockedTitle={blockedTitle(section, inactivating.name, "inactivated")}
          blocked={used(data, section, inactivating.id)}
          note="It will no longer be available for skills and assignments."
          usage={usageItems(data, section, inactivating.id)}
          onClose={() => setInactivating(null)}
          onConfirm={() => {
            const s = "levels" as const;
            if (commit({ ...data, [s]: data[s].map((x) => x.id === inactivating.id ? { ...x, status: "Inactive" } : x) }, `${inactivating.name} inactivated`))
              setInactivating(null);
          }}
        />
      )}
      {deleting && section !== "skills" && (
        <ConfirmDialog
          action="delete"
          name={deleting.name}
          blockedTitle={blockedTitle(section, deleting.name, "deleted")}
          blocked={used(data, section, deleting.id)}
          usage={usageItems(data, section, deleting.id)}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            const s = "levels" as const;
            if (commit({ ...data, [s]: data[s].filter((x) => x.id !== deleting.id) }, `${deleting.name} deleted`))
              setDeleting(null);
          }}
        />
      )}
    </section>
  );
}
