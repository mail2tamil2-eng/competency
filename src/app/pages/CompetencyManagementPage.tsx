import { useEffect, useState } from "react";
import {
  Layers,
  Target,
  Users,
  Plus,
  Upload,
  Search,
  Pencil,
  Trash2,
  ArrowRight,
  Download,
  LayoutGrid,
  ListChecks,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import {
  Data,
  Assignment,
  key,
  readData,
  progress,
  download,
  uid,
} from "../competency/model";
import {
  CompetencyLibrary,
  LibraryIntent,
} from "../competency/CompetencyLibrary";
import { LibrarySettings } from "../competency/LibrarySettings";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import "../competency/competency.css";
import {
  CourseMapping,
  RoleMapping,
  Learning,
  Reports,
} from "../competency/Workflows";
import {
  WorkflowData,
  workflowSeed,
  applyPlans,
  updateCurrent,
} from "../competency/workflowModel";
const tabs = [
  ["overview", "Overview", LayoutGrid],
  ["library", "Competencies & Skills", Layers],
  ["assignments", "Progress", Users],
  ["courses", "Course mapping", BookOpen],
  ["roles", "Role mapping", Users],
  ["reports", "Reports", ListChecks],
  ["settings", "Library settings", ListChecks],
  ["learner", "My learning", BookOpen],
  ["manager", "Team progress", Users],
] as const;
type Tab = (typeof tabs)[number][0];
export function CompetencyManagementPage() {
  const [data, setData] = useState<Data>(readData),
    [tab, setTab] = useState<Tab>("overview"),
    [query, setQuery] = useState("");
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]),
    [bulkLevel, setBulkLevel] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [libraryIntent, setLibraryIntent] = useState<LibraryIntent>(null);
  const [settingsSection, setSettingsSection] = useState<
    "categories" | "levels"
  >("categories");
  const commit = (next: Data, message: string) => {
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setData(next);
      toast.success(message);
      return true;
    } catch {
      toast.error(
        "Unable to save. Browser storage may be full or unavailable. Your changes have not been saved.",
      );
      return false;
    }
  };
  useEffect(() => {
    const search = (event: Event) => {
      const term = (event as CustomEvent).detail;
      if (typeof term !== "string") return;
      setTab("library");
      setQuery(term);
      setLibraryIntent({ action: "search", nonce: Date.now() });
    };
    window.addEventListener("competency-search", search);
    return () => window.removeEventListener("competency-search", search);
  }, []);
  const work = data.workflow || workflowSeed;
  const saveWorkflow = (next: Data, workflow: WorkflowData, message: string) =>
    commit({ ...next, workflow }, message);
  useEffect(() => {
    const current = readData();
    const next = applyPlans(
      current,
      current.workflow || structuredClone(workflowSeed),
      new Date().toLocaleDateString("en-CA"),
    );
    if (
      JSON.stringify(next.data.assignments) !==
        JSON.stringify(current.assignments) ||
      JSON.stringify(next.work.plans) !==
        JSON.stringify((current.workflow || workflowSeed).plans)
    ) {
      try {
        const updated = { ...next.data, workflow: next.work };
        localStorage.setItem(key, JSON.stringify(updated));
        setData(updated);
      } catch {
        toast.error("Scheduled assignments could not be saved.");
      }
    }
  }, []);
  const navigate = (
    next: Tab | "categories" | "levels" | "competencies" | "skills",
  ) => {
    if (next === "categories" || next === "levels") {
      setSettingsSection(next);
      next = "settings";
    }
    if (next === "competencies" || next === "skills") next = "library";
    setLibraryIntent(null);
    setSelectedAssignments([]);
    setBulkLevel("");
    setTab(next);
    setQuery("");
  };
  const completed = data.assignments.filter(
    (a) => progress(data, a) === "Completed",
  ).length;
  const percent = data.assignments.length
    ? Math.round((completed / data.assignments.length) * 100)
    : 0;
  const catName = (id?: string) =>
    data.categories.find((c) => c.id === id)?.name || "—";
  const levelName = (id: string) =>
    data.levels.find((l) => l.id === id)?.name || "Not recorded";
  const openLibrary = (id?: string) => {
    navigate("library");
    setLibraryIntent({ action: id ? "open" : "create", id, nonce: Date.now() });
  };
  return (
    <div className="cm">
      <div className="cm-heading">
        <div className="cm-heading-icon">
          <Layers size={24} />
        </div>
        <div>
          <div className="cm-eyebrow">PEOPLE DEVELOPMENT</div>
          <h1>Competency Management</h1>
          <p>Build capabilities. Close skill gaps. Help your people grow.</p>
        </div>
        <div className="cm-view-select">
          <span className="cm-local">Prototype · Saved in this browser</span>
          <select
            aria-label="Workspace view"
            value={
              tab === "learner"
                ? "learner"
                : tab === "manager"
                  ? "manager"
                  : "admin"
            }
            onChange={(e) =>
              navigate(
                e.target.value === "admin"
                  ? "overview"
                  : (e.target.value as Tab),
              )
            }
          >
            <option value="admin">Administrator</option>
            <option value="learner">Learner preview</option>
            <option value="manager">Manager preview</option>
          </select>
        </div>
      </div>
      <nav className="cm-tabs" aria-label="Competency sections">
        {tabs
          .filter(([id]) =>
            tab === "learner"
              ? id === "learner"
              : tab === "manager"
                ? id === "manager"
                : id !== "learner" && id !== "manager",
          )
          .map(([id, label, Icon]) => (
            <button
              key={id}
              aria-current={tab === id ? "page" : undefined}
              className={tab === id ? "active" : ""}
              onClick={() => navigate(id)}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
      </nav>
      <div className="cm-body">
        {tab === "library" && (
          <CompetencyLibrary
            data={data}
            query={query}
            onQuery={setQuery}
            intent={libraryIntent}
            onSettings={() => navigate("settings")}
            commit={commit}
          />
        )}
        {tab === "settings" && (
          <LibrarySettings
            data={data}
            initialSection={settingsSection}
            commit={commit}
          />
        )}

        {tab === "courses" && (
          <CourseMapping data={data} work={work} save={saveWorkflow} />
        )}
        {tab === "roles" && (
          <RoleMapping data={data} work={work} save={saveWorkflow} />
        )}
        {tab === "learner" && (
          <Learning data={data} work={work} save={saveWorkflow} />
        )}
        {tab === "manager" && (
          <Learning
            key="manager"
            data={data}
            work={work}
            save={saveWorkflow}
            manager
          />
        )}
        {tab === "reports" && (
          <Reports data={data} work={work} save={saveWorkflow} />
        )}

        {tab === "overview" && (
          <>
            <section className="cm-welcome">
              <div>
                <span className="cm-eyebrow">YOUR TEAM'S NEXT CHAPTER</span>
                <h2>Great growth starts with clear expectations.</h2>
                <p>
                  Create your competency library, define proficiency, and see
                  where your people can grow.
                </p>
                <button
                  className="cm-button primary"
                  onClick={() => openLibrary()}
                >
                  Create a competency <ArrowRight size={16} />
                </button>
              </div>
              <div className="cm-growth">
                <Target size={56} />
                <span>Define → Develop → Grow</span>
              </div>
            </section>
            <div className="cm-stats">
              {[
                [
                  "Competencies",
                  data.competencies.length,
                  Layers,
                  "Your capability library",
                ],
                [
                  "Skills",
                  data.skills.length,
                  Target,
                  "Building blocks of growth",
                ],
                [
                  "Enrolled learners",
                  new Set(data.assignments.map((a) => a.name)).size,
                  Users,
                  "In the demo workspace",
                ],
                [
                  "Overall completion",
                  percent + "%",
                  CheckCircle2,
                  "Across assigned skills",
                ],
              ].map(([label, value, Icon, sub]) => {
                const Symbol = Icon as typeof Layers;
                return (
                  <article key={String(label)}>
                    <Symbol size={20} />
                    <span>{String(label)}</span>
                    <strong>{String(value)}</strong>
                    <small>{String(sub)}</small>
                  </article>
                );
              })}
            </div>
            <div className="cm-overview-grid">
              <section className="cm-card">
                <div className="cm-section-head">
                  <div>
                    <h2>Competency library</h2>
                    <p>
                      A shared language for skills across your organization.
                    </p>
                  </div>
                  <button
                    className="cm-text-button"
                    onClick={() => navigate("competencies")}
                  >
                    View all <ArrowRight size={15} />
                  </button>
                </div>
                {data.competencies.slice(0, 4).map((c) => (
                  <button
                    className="cm-library-row"
                    key={c.id}
                    onClick={() => openLibrary(c.id)}
                  >
                    <span className="cm-mini-icon">
                      <Layers size={20} />
                    </span>
                    <span>
                      <strong>{c.name}</strong>
                      <small>
                        {catName(c.categoryId)} ·{" "}
                        {
                          data.skills.filter((s) => s.competencyId === c.id)
                            .length
                        }{" "}
                        skills
                      </small>
                    </span>
                    <span className={"cm-badge " + c.status.toLowerCase()}>
                      {c.status}
                    </span>
                    <ArrowRight size={16} />
                  </button>
                ))}
              </section>
              <section className="cm-card">
                <h2>Set your team up for success</h2>
                <p>Follow these steps to build a connected library.</p>
                {[
                  [
                    "library",
                    "Create competencies & skills",
                    "Define related abilities together.",
                  ],
                  [
                    "courses",
                    "Connect learning content",
                    "Map courses to skill levels.",
                  ],
                  [
                    "roles",
                    "Set expectations by role",
                    "Choose skills and the right audience.",
                  ],
                  [
                    "assignments",
                    "Assign and track progress",
                    "Find the next opportunity to grow.",
                  ],
                ].map(([id, label, desc], i) => (
                  <button
                    className="cm-setup"
                    key={id}
                    onClick={() => navigate(id as Tab)}
                  >
                    <span>{i + 1}</span>
                    <div>
                      <strong>{label}</strong>
                      <small>{desc}</small>
                    </div>
                    <ArrowRight size={15} />
                  </button>
                ))}
              </section>
            </div>
          </>
        )}
        {tab === "assignments" && (
          <section className="cm-card">
            <div className="cm-section-head">
              <div>
                <h2>Assignments & progress</h2>
                <p>
                  Set expectations and record current proficiency for each
                  learner.
                </p>
              </div>
              <div className="cm-actions">
                <button
                  className="cm-button"
                  onClick={() =>
                    download("learner-progress.csv", [
                      [
                        "Learner",
                        "Department",
                        "Skill",
                        "Current level",
                        "Expected level",
                        "Status",
                      ],
                      ...data.assignments.map((a) => [
                        a.name,
                        a.department,
                        data.skills.find((s) => s.id === a.skillId)?.name || "",
                        levelName(a.current),
                        levelName(a.expected),
                        progress(data, a),
                      ]),
                    ])
                  }
                >
                  <Download size={16} />
                  Export CSV
                </button>
                <button
                  className="cm-button primary"
                  onClick={() => setAssigning(true)}
                >
                  <Plus size={16} />
                  Assign skill
                </button>
              </div>
            </div>
            <div className="cm-hint">
              Demo workspace: assignments and progress are saved locally.
              Employee directory sync and automatic course enrolment are not
              connected.
            </div>
            <div className="cm-toolbar">
              <label className="cm-search">
                <Search size={16} />
                <input
                  aria-label="Search learners"
                  placeholder="Search learner, department or skill…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              {selectedAssignments.length > 0 && (
                <>
                  <span>{selectedAssignments.length} selected</span>
                  <select
                    aria-label="Bulk current level"
                    value={bulkLevel}
                    onChange={(e) => setBulkLevel(e.target.value)}
                  >
                    <option value="">Choose current level</option>
                    {data.levels
                      .filter((l) => l.status === "Active")
                      .map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                  </select>
                  <button
                    className="cm-button primary"
                    disabled={!bulkLevel}
                    onClick={() => {
                      let next = { data, work };
                      for (const id of selectedAssignments)
                        next = updateCurrent(
                          next.data,
                          next.work,
                          id,
                          bulkLevel,
                          "Admin",
                        );
                      if (
                        saveWorkflow(
                          next.data,
                          next.work,
                          "Current levels updated",
                        )
                      ) {
                        setSelectedAssignments([]);
                        setBulkLevel("");
                      }
                    }}
                  >
                    Update selected
                  </button>
                </>
              )}
            </div>
            <div className="cm-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Learner</th>
                    <th>Skill</th>
                    <th>Current level</th>
                    <th>Expected level</th>
                    <th>Skill gap</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.assignments
                    .filter((a) =>
                      (
                        a.name +
                        " " +
                        a.department +
                        " " +
                        data.skills.find((s) => s.id === a.skillId)?.name
                      )
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                    )
                    .map((a) => (
                      <tr key={a.id}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={
                              "Select " +
                              a.name +
                              " " +
                              data.skills.find((s) => s.id === a.skillId)?.name
                            }
                            checked={selectedAssignments.includes(a.id)}
                            onChange={(e) =>
                              setSelectedAssignments(
                                e.target.checked
                                  ? [...selectedAssignments, a.id]
                                  : selectedAssignments.filter(
                                      (id) => id !== a.id,
                                    ),
                              )
                            }
                          />
                        </td>
                        <td>
                          <strong>{a.name}</strong>
                          <small>{a.department}</small>
                        </td>
                        <td>
                          {data.skills.find((s) => s.id === a.skillId)?.name}
                        </td>
                        <td>
                          <select
                            aria-label={
                              "Current level for " +
                              a.name +
                              " " +
                              data.skills.find((s) => s.id === a.skillId)?.name
                            }
                            value={a.current}
                            onChange={(e) => {
                              const next = updateCurrent(
                                data,
                                work,
                                a.id,
                                e.target.value,
                                "Admin",
                              );
                              saveWorkflow(
                                next.data,
                                next.work,
                                "Current level updated",
                              );
                            }}
                          >
                            <option value="">Not recorded</option>
                            {data.levels
                              .filter((x) => x.status === "Active")
                              .map((l) => (
                                <option key={l.id} value={l.id}>
                                  {l.name}
                                </option>
                              ))}
                          </select>
                          {a.updatedBy && (
                            <small>Updated by {a.updatedBy}</small>
                          )}
                        </td>
                        <td>{levelName(a.expected)}</td>
                        <td>
                          {!a.current
                            ? "Record current level"
                            : data.levels
                                .slice(
                                  data.levels.findIndex(
                                    (l) => l.id === a.current,
                                  ) + 1,
                                  data.levels.findIndex(
                                    (l) => l.id === a.expected,
                                  ) + 1,
                                )
                                .map((l) => l.name)
                                .join(" → ") || "No gap"}
                        </td>
                        <td>
                          <span
                            className={
                              "cm-badge " +
                              (progress(data, a) === "Completed"
                                ? "active"
                                : progress(data, a) === "In Progress"
                                  ? "draft"
                                  : "inactive")
                            }
                          >
                            {progress(data, a)}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
      {assigning && (
        <AssignmentForm
          data={data}
          onClose={() => setAssigning(false)}
          onSave={(a) => {
            if (
              commit(
                { ...data, assignments: [...data.assignments, a] },
                "Skill assigned",
              )
            )
              setAssigning(false);
          }}
        />
      )}
    </div>
  );
}
function AssignmentForm({
  data,
  onClose,
  onSave,
}: {
  data: Data;
  onClose: () => void;
  onSave: (a: Assignment) => void;
}) {
  const [a, setA] = useState<Assignment>({
      id: uid(),
      name: "",
      department: "",
      skillId: "",
      expected: "",
      current: "",
    }),
    [error, setError] = useState("");
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="cm-dialog">
        <DialogHeader>
          <DialogTitle>Assign a skill</DialogTitle>
          <DialogDescription>
            Choose a learner and the proficiency they need to reach.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (
              data.assignments.some(
                (x) =>
                  x.name.toLowerCase() === a.name.trim().toLowerCase() &&
                  x.skillId === a.skillId,
              )
            ) {
              setError(
                "This learner already has this skill assigned. Update their current level in the table.",
              );
              return;
            }
            onSave({
              ...a,
              name: a.name.trim(),
              department: a.department.trim(),
            });
          }}
        >
          {error && (
            <p role="alert" className="cm-error">
              {error}
            </p>
          )}
          <label>
            Learner name *
            <input
              required
              value={a.name}
              onChange={(e) => setA({ ...a, name: e.target.value })}
            />
          </label>
          <label>
            Department *
            <input
              required
              value={a.department}
              onChange={(e) => setA({ ...a, department: e.target.value })}
            />
          </label>
          <label>
            Skill *
            <select
              required
              value={a.skillId}
              onChange={(e) => setA({ ...a, skillId: e.target.value })}
            >
              <option value="">Choose a skill</option>
              {data.skills
                .filter((s) => s.status === "Active")
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Expected level *
            <select
              required
              value={a.expected}
              onChange={(e) => setA({ ...a, expected: e.target.value })}
            >
              <option value="">Choose expected level</option>
              {data.levels
                .filter((l) => l.status === "Active")
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
            </select>
          </label>
          <p className="cm-hint">
            Current level starts empty. Record it from the progress table after
            assessing the learner.
          </p>
          <div className="cm-dialog-actions">
            <button type="button" className="cm-button" onClick={onClose}>
              Cancel
            </button>
            <button className="cm-button primary">Assign skill</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
