import { LearnerProgress } from "../competency/LearnerProgress";
import { ManagerProgress } from "../competency/ManagerProgress";
import { LearnerSkillReport } from "../competency/LearnerSkillReport";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Layers,
  Users,
  ListChecks,
  BookOpen,
  Settings2,
  BarChart2,
  GraduationCap,
  TrendingUp,
  Map,
  CheckCircle2,
  Circle,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { Data, Assignment, key, readData, uid } from "../competency/model";
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
import "../competency/design-system.css";
import "../competency/platform-theme.css";
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
} from "../competency/workflowModel";
const tabs = [
  ["settings", "Library settings", Settings2],
  ["library", "Competency framework", Layers],
  ["roles", "Role mapping", Map],
  ["assignments", "Progress", BarChart2],
  ["courses", "Course mapping", BookOpen],
  ["reports", "Reports", ListChecks],
  ["learner", "My learning", GraduationCap],
  ["learner-report", "Skill progress report", TrendingUp],
  ["manager", "Team progress", Users],
] as const;
type Tab = (typeof tabs)[number][0];
export function CompetencyManagementPage() {
  const location = useLocation();
  const routeNavigate = useNavigate();
  const [data, setData] = useState<Data>(readData),
    [activeTab, setTab] = useState<Tab>("library"),
    [query, setQuery] = useState("");
  const tab = location.pathname.includes("/manager")
    ? "manager"
    : location.pathname.endsWith("/learner/report")
      ? "learner-report"
      : location.pathname.endsWith("/learner")
        ? "learner"
        : activeTab;
  const isLearner = tab === "learner" || tab === "learner-report";
  const [learnerKey, setLearnerKey] = useState("");
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

    setTab(next === "manager" ? "library" : next);
    routeNavigate(
      next === "manager"
        ? "/competency-management/manager"
        : next === "learner-report"
          ? "/competency-management/learner/report"
          : next === "learner"
            ? "/competency-management/learner"
            : "/competency-management",
    );
    setQuery("");
  };
  return (
    <div className="cm">
      <div className="cm-heading">
        <div className="cm-heading-icon">
          <Layers size={24} />
        </div>
        <div>
          <h1>Competency Management</h1>
          <p>Build capabilities. Close skill gaps. Help your people grow.</p>
        </div>
        <div className="cm-view-select">
          <select
            aria-label="Workspace view"
            value={
              isLearner ? "learner" : tab === "manager" ? "manager" : "admin"
            }
            onChange={(e) =>
              navigate(
                e.target.value === "admin"
                  ? "library"
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
      {!isLearner && tab !== "manager" && (
        <SetupGuide data={data} work={work} activeTab={tab} onNavigate={navigate} />
      )}
      {tab !== "manager" && (
        <nav className="cm-tabs" aria-label="Competency sections">
          {tabs
            .filter(([id]) =>
              isLearner
                ? id === "learner" || id === "learner-report"
                : id !== "learner" &&
                    id !== "learner-report" &&
                    id !== "manager",
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
      )}
      <div className="cm-body">
        {tab === "library" && (
          <CompetencyLibrary
            data={data}
            query={query}
            onQuery={setQuery}
            intent={libraryIntent}
            onSettings={() => navigate("settings")}
            commit={commit}
            work={work}
            onSaveWork={(next, msg) => saveWorkflow(data, next, msg)}
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
          <Learning
            data={data}
            work={work}
            save={saveWorkflow}
            learnerKey={learnerKey}
            onLearnerChange={setLearnerKey}
          />
        )}
        {tab === "learner-report" && (
          <LearnerSkillReport
            data={data}
            learnerKey={learnerKey}
            onLearnerChange={setLearnerKey}
          />
        )}
        {tab === "manager" && (
          <ManagerProgress
            key={location.pathname}
            data={data}
            work={work}
            save={saveWorkflow}
          />
        )}
        {tab === "reports" && <Reports data={data} work={work} />}

        {tab === "assignments" && (
          <LearnerProgress
            data={data}
            work={work}
            save={saveWorkflow}
          />
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
function SetupGuide({
  data,
  work,
  activeTab,
  onNavigate,
}: {
  data: Data;
  work: WorkflowData;
  activeTab: Tab;
  onNavigate: (tab: Tab) => void;
}) {
  const [open, setOpen] = useState(true);
  const steps = [
    {
      id: "settings" as Tab,
      label: "Set up categories & levels",
      detail: "Set up the building blocks every competency needs",
      done:
        data.categories.some((c) => c.status === "Active") &&
        data.levels.some((l) => l.status === "Active"),
    },
    {
      id: "library" as Tab,
      label: "Build your competency framework",
      detail: "Create competencies, then add individual skills inside them",
      done: data.skills.some((s) => s.status === "Active"),
    },
    {
      id: "roles" as Tab,
      label: "Map roles and assign skills",
      detail: "Choose skills and assign them to your employees",
      done: work.plans.some((p) => p.status === "Active"),
    },
    {
      id: "assignments" as Tab,
      label: "Track learner progress",
      detail: "See where each employee stands and update their skill level",
      done: data.assignments.length > 0,
    },
  ];
  const completed = steps.filter((s) => s.done).length;
  if (completed === steps.length) return null;
  return (
    <div className="cm-setup-guide">
      <button
        className="cm-setup-guide-header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>
          <strong>Getting started</strong>
          <small>
            {completed} of {steps.length} steps complete
          </small>
        </span>
        <div className="cm-setup-guide-track">
          {steps.map((s, i) => (
            <span
              key={i}
              className={"cm-setup-pip" + (s.done ? " done" : "")}
            />
          ))}
        </div>
        <ChevronDown
          size={16}
          className={open ? "cm-rotated" : ""}
          style={{ color: "#526176", flexShrink: 0 }}
        />
      </button>
      {open && (
        <div className="cm-setup-steps">
          {steps.map((step, i) => (
            <button
              key={step.id}
              className={
                "cm-setup-step" +
                (step.done ? " done" : "") +
                (activeTab === step.id ? " current" : "")
              }
              onClick={() => onNavigate(step.id)}
            >
              <span className="cm-step-icon">
                {step.done ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <Circle size={18} />
                )}
              </span>
              <span className="cm-step-number">{i + 1}</span>
              <span className="cm-step-text">
                <strong>{step.label}</strong>
                <small>{step.detail}</small>
              </span>
            </button>
          ))}
        </div>
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
              assignedDate: new Date().toISOString(),
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
