import { LearnerProgress } from "../competency/LearnerProgress";
import { ManagerProgress } from "../competency/ManagerProgress";
import { LearnerSkillReport } from "../competency/LearnerSkillReport";
import { CareerProgressionConfig } from "../competency/CareerProgressionConfig";
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
  Route,
} from "lucide-react";
import { toast } from "sonner";
import { Data, Assignment, key, readData, seed, uid } from "../competency/model";
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
  ["career-progression", "Role progression", Route],
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
  const [confirmReset, setConfirmReset] = useState(false);
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
          <button
            className="cm-button cm-reset-demo-btn"
            title="Reset all data back to demo defaults"
            onClick={() => setConfirmReset(true)}
          >
            Reset demo data
          </button>
        </div>
      </div>

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
            work={work}
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
        {tab === "career-progression" && (
          <CareerProgressionConfig data={data} work={work} save={saveWorkflow} />
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
      {confirmReset && (
        <Dialog open onOpenChange={(open) => { if (!open) setConfirmReset(false); }}>
          <DialogContent className="cm-dialog">
            <DialogHeader>
              <DialogTitle>Reset demo data?</DialogTitle>
              <DialogDescription>
                This will erase all your changes and restore the original demo records. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="cm-dialog-actions">
              <button className="cm-button" onClick={() => setConfirmReset(false)}>Cancel</button>
              <button
                className="cm-button primary"
                onClick={() => {
                  const fresh = { ...seed, workflow: workflowSeed };
                  localStorage.setItem(key, JSON.stringify(fresh));
                  setData(fresh);
                  setConfirmReset(false);
                  toast.success("Demo data restored");
                }}
              >
                Yes, reset
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
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
            <span className="cm-req-label">Learner name <span className="req">*</span></span>
            <input
              required
              value={a.name}
              onChange={(e) => setA({ ...a, name: e.target.value })}
            />
          </label>
          <label>
            <span className="cm-req-label">Department <span className="req">*</span></span>
            <input
              required
              value={a.department}
              onChange={(e) => setA({ ...a, department: e.target.value })}
            />
          </label>
          <label>
            <span className="cm-req-label">Skill <span className="req">*</span></span>
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
            <span className="cm-req-label">Expected level <span className="req">*</span></span>
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
