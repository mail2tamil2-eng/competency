import { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Ban, CheckCircle2, ArrowLeft, Upload } from "lucide-react";
import { Data, RecordItem, uid, used } from "./model";
import { WorkflowData } from "./workflowModel";
import { Editor } from "./Editor";
import { SkillInlineEdit } from "./CompetencyLibrary";
import { SkillBulkUpload } from "./SkillBulkUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";

type Section = "categories" | "levels" | "skills";

/** Where a skill is used, so confirmations can explain the impact. */
function skillUsage(data: Data, id: string) {
  const competencies = data.competencies.filter((c) => data.skills.some((s) => s.id === id && s.competencyId === c.id));
  const courses = (data.workflow?.courses ?? []).filter((c) => c.mappings.some((m) => m.skillId === id));
  const plans = (data.workflow?.plans ?? []).filter((p) => p.skills.some((s) => s.skillId === id));
  const learners = data.assignments.filter((a) => a.skillId === id).length;
  return { competencies, courses, plans, learners };
}
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function UsageList({ data, id }: { data: Data; id: string }) {
  const u = skillUsage(data, id);
  const items = [
    u.competencies.length > 0 && `${u.competencies.length === 1 ? "Competency" : "Competencies"}: ${u.competencies.map((c) => c.name).join(", ")}`,
    u.courses.length > 0 && `${u.courses.length === 1 ? "Mapped course" : "Mapped courses"}: ${u.courses.map((c) => c.name).join(", ")}`,
    u.plans.length > 0 && `${u.plans.length === 1 ? "Assignment plan" : "Assignment plans"}: ${u.plans.map((p) => p.name).join(", ")}`,
    u.learners > 0 && `Assigned to ${plural(u.learners, "learner")}`,
  ].filter(Boolean) as string[];
  if (!items.length) return null;
  return (
    <ul className="cm-usage-list">
      {items.map((t) => <li key={t}>{t}</li>)}
    </ul>
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
  }, [initialSection]);

  const records = (section === "skills" ? [] : data[section as "categories" | "levels"])
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
  if (section === "skills" && skillView !== "list") {
    const isCreating = skillView === "create";
    const existing = isCreating ? null : data.skills.find((s) => s.id === skillView) ?? null;
    const draft: RecordItem = existing
      ? structuredClone(existing)
      : { id: uid(), name: "", description: "", status: "Active", levels: {}, categoryId: "" };
    return (
      <section className="cm-card">
        <div className="cm-section-head">
          <div>
            <h2>Library Settings</h2>
            <p>Manage categories, proficiency levels and skills used across your competency framework.</p>
          </div>
        </div>
        <div className="cm-skill-master-view">
          <button type="button" className="cm-text-button" onClick={() => setSkillView("list")}>
            <ArrowLeft size={15} /> Back to Skill Master
          </button>
          <h3 style={{ marginTop: 16 }}>{isCreating ? "New Skill" : `Edit: ${existing?.name}`}</h3>
          <SkillInlineEdit
            showMandatory={false}
            skill={draft}
            data={data}
            work={work}
            onSaveWork={onSaveWork}
            onCancel={() => setSkillView("list")}
            onSave={(saved) => {
              const isNew = !data.skills.some((s) => s.id === saved.id);
              if (
                commit(
                  { ...data, skills: isNew ? [...data.skills, saved] : data.skills.map((s) => (s.id === saved.id ? saved : s)) },
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
          <p>Manage categories, proficiency levels and skills used across your competency framework.</p>
        </div>
        <div className="cm-settings-tabs-bar">
          <div
            className="cm-settings-tabs"
            role="group"
            aria-label="Library Settings Sections"
          >
            {(["categories", "levels", "skills"] as const).map((s) => (
              <button
                className={section === s ? "active" : ""}
                aria-pressed={section === s}
                key={s}
                onClick={() => {
                  setSection(s);
                  setQuery("");
                  setStatus("");
                  setSkillView("list");
                }}
              >
                {s === "categories" ? "Categories" : s === "levels" ? "Proficiency Levels" : "Skill Master"}
                <span className="cm-tab-count">{s === "skills" ? data.skills.length : data[s as "categories" | "levels"].length}</span>
              </button>
            ))}
          </div>
          {section !== "skills" ? (
            <button className="cm-button primary" onClick={() => setEditing({})}>
              <Plus size={16} />
              Add {section === "categories" ? "Category" : "Level"}
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
                  const comps = data.competencies.filter((c) => c.id === s.competencyId);
                  return (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.name}</strong>
                        <small>{s.description || "No description added"}</small>
                      </td>
                      <td className="cm-competency-count">
                        <strong>{comps.length}</strong>
                        <small>{comps.length ? comps.map((c) => c.name).join(", ") : "Not linked"}</small>
                      </td>
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
            <Dialog open onOpenChange={(open) => { if (!open) setSkillInactivating(null); }}>
              <DialogContent className="cm-dialog">
                <DialogHeader>
                  <DialogTitle>
                    {used(data, "skills", skillInactivating.id)
                      ? `Can't inactivate ${skillInactivating.name}`
                      : `Inactivate ${skillInactivating.name}?`}
                  </DialogTitle>
                  <DialogDescription>
                    {used(data, "skills", skillInactivating.id)
                      ? "This skill is in use. Remove it from the items below first, then try again."
                      : "The skill will be hidden when creating competencies and assignments. Existing records are kept, and you can activate it again at any time."}
                  </DialogDescription>
                </DialogHeader>
                <UsageList data={data} id={skillInactivating.id} />
                <div className="cm-dialog-actions">
                  <button className="cm-button" onClick={() => setSkillInactivating(null)}>{used(data, "skills", skillInactivating.id) ? "Close" : "Cancel"}</button>
                  {!used(data, "skills", skillInactivating.id) && (
                    <button className="cm-button destructive" onClick={() => {
                      if (commit({ ...data, skills: data.skills.map((x) => x.id === skillInactivating.id ? { ...x, status: "Inactive" as const } : x) }, `${skillInactivating.name} inactivated`))
                        setSkillInactivating(null);
                    }}>Yes, Inactivate</button>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
          {skillDeleting && (
            <Dialog open onOpenChange={(open) => { if (!open) setSkillDeleting(null); }}>
              <DialogContent className="cm-dialog">
                <DialogHeader>
                  <DialogTitle>
                    {used(data, "skills", skillDeleting.id)
                      ? `Can't delete ${skillDeleting.name}`
                      : `Delete ${skillDeleting.name}?`}
                  </DialogTitle>
                  <DialogDescription>
                    {used(data, "skills", skillDeleting.id)
                      ? "This skill is in use. Remove it from the items below first, or inactivate it instead."
                      : skillDeleting.competencyId
                        ? "This permanently deletes the skill and its level descriptions, and removes it from the competency below. This can't be undone."
                        : "This permanently deletes the skill and its level descriptions. This can't be undone."}
                  </DialogDescription>
                </DialogHeader>
                <UsageList data={data} id={skillDeleting.id} />
                <div className="cm-dialog-actions">
                  <button className="cm-button" onClick={() => setSkillDeleting(null)}>{used(data, "skills", skillDeleting.id) ? "Close" : "Cancel"}</button>
                  {!used(data, "skills", skillDeleting.id) && (
                    <button className="cm-button destructive" onClick={() => {
                      if (commit({ ...data, skills: data.skills.filter((x) => x.id !== skillDeleting.id) }, `${skillDeleting.name} deleted`))
                        setSkillDeleting(null);
                    }}>Yes, Delete</button>
                  )}
                </div>
              </DialogContent>
            </Dialog>
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
      {editing && section !== "skills" && (
        <Editor
          kind={section as "categories" | "levels"}
          data={data}
          item={editing.item}
          onClose={() => setEditing(null)}
          onSave={(item) => {
            const isNew = !editing.item;
            const nextData =
              section === "levels"
                ? { ...data, levels: applyLevelOrder(data.levels, item, isNew) }
                : {
                    ...data,
                    [section]: isNew
                      ? [...data[section], item]
                      : data[section].map((x) => (x.id === item.id ? item : x)),
                  };
            if (commit(nextData, "Saved successfully")) setEditing(null);
          }}
        />
      )}
      {inactivating && (
        <Dialog open onOpenChange={(open) => { if (!open) setInactivating(null); }}>
          <DialogContent className="cm-dialog">
            <DialogHeader>
              <DialogTitle>
                {used(data, section, inactivating.id)
                  ? section === "levels"
                    ? `${inactivating.name} is mapped to a competency, skill, role, course, or learner usage and cannot be inactivated.`
                    : `${inactivating.name} is mapped to a competency and cannot be inactivated.`
                  : `Are you sure you want to inactivate ${inactivating.name}?`}
              </DialogTitle>
              <DialogDescription />
            </DialogHeader>
            <div className="cm-dialog-actions">
              <button className="cm-button" onClick={() => setInactivating(null)}>Cancel</button>
              {!used(data, section, inactivating.id) && (
                <button
                  className="cm-button destructive"
                  onClick={() => {
                    const s = section as "categories" | "levels";
                    if (
                      commit(
                        { ...data, [s]: data[s].map((x) => x.id === inactivating.id ? { ...x, status: "Inactive" } : x) },
                        `${inactivating.name} inactivated`,
                      )
                    )
                      setInactivating(null);
                  }}
                >
                  Inactivate
                </button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      {deleting && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setDeleting(null);
          }}
        >
          <DialogContent className="cm-dialog">
            <DialogHeader>
              <DialogTitle>
                {section === "levels"
                  ? used(data, "levels", deleting.id)
                    ? `${deleting.name} is mapped to a skill, role, course, or learner usage and cannot be deleted.`
                    : `Are you sure you want to delete ${deleting.name}?`
                  : used(data, section, deleting.id)
                    ? `${deleting.name} is mapped to a competency and cannot be deleted.`
                    : `Are you sure you want to delete ${deleting.name}?`}
              </DialogTitle>
              <DialogDescription />
            </DialogHeader>
            <div className="cm-dialog-actions">
              <button className="cm-button" onClick={() => setDeleting(null)}>
                Cancel
              </button>
              {!used(data, section as "categories" | "levels", deleting.id) && (
                <button
                  className="cm-button destructive"
                  onClick={() => {
                    const s = section as "categories" | "levels";
                    if (
                      commit(
                        {
                          ...data,
                          [s]: data[s].filter(
                            (x) => x.id !== deleting.id,
                          ),
                        },
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
    </section>
  );
}
