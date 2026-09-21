import { test, expect, Page } from "@playwright/test";
import { seed, csv, used } from "../src/app/competency/model";
import {
  libraryHeaders,
  prepareLibraryImport,
} from "../src/app/competency/libraryImport";
import { applyPlans, workflowSeed } from "../src/app/competency/workflowModel";
test.beforeEach(async ({ page }) => {
  await page.goto(process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:5190");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});
async function library(page: Page) {
  await page
    .getByRole("navigation", { name: "Competency sections" })
    .getByRole("button", { name: /^Competencies & Skills/ })
    .click();
}
async function settings(page: Page) {
  await page
    .getByRole("navigation", { name: "Competency sections" })
    .getByRole("button", { name: "Library settings", exact: true })
    .click();
}
async function proficiency(page: Page, names: string[]) {
  for (const name of names)
    for (const level of ["Beginner", "Intermediate", "Advanced", "Expert"])
      await page
        .getByLabel(level + " for " + name, { exact: true })
        .fill(level + " ability in " + name);
}
const header = libraryHeaders(seed);
test("combined import groups repeated competencies and keeps existing IDs", () => {
  const result = prepareLibraryImport(
    csv([
      header,
      [
        "Customer Focus",
        "Serving customers",
        "Foundation",
        "Customer Empathy",
        "Understand needs",
        "Identify needs",
        "Ask questions",
        "Resolve needs",
        "Coach others",
      ],
      [
        "Customer Focus",
        "Serving customers",
        "Foundation",
        "Service Recovery",
        "Resolve issues",
        "Observe",
        "Assist",
        "Resolve",
        "Coach",
      ],
      [
        "Communication",
        "",
        "Foundation",
        "Business Writing",
        "",
        "Basics",
        "Guided",
        "Independent",
        "Expert",
      ],
    ]),
    seed,
  );
  expect(result.rows.every((r) => !r.errors.length)).toBe(true);
  expect(result.competencies).toHaveLength(1);
  expect(result.skills).toHaveLength(3);
  expect(result.skills[0].competencyId).toBe(result.skills[1].competencyId);
  expect(result.skills[2].competencyId).toBe("communication");
  expect(used({ ...seed, workflow: workflowSeed }, "skills", "listening")).toBe(
    true,
  );
  const invalid = prepareLibraryImport(
    csv([
      header,
      [
        "Brand New",
        "",
        "Foundation",
        "Duplicate Skill",
        "",
        "A",
        "B",
        "C",
        "D",
      ],
      ["Brand New", "", "Technical", "Duplicate Skill", "", "A", "B", "C", "D"],
    ]),
    seed,
  );
  expect(invalid.rows[1].errors.join(" ")).toContain("different category");
  expect(invalid.rows[1].errors.join(" ")).toContain("already exists");
});
test("one library navigation and nested skill search clarify the hierarchy", async ({
  page,
}) => {
  const nav = page.getByRole("navigation", { name: "Competency sections" });
  await expect(
    nav.getByRole("button", { name: "Skills", exact: true }),
  ).toHaveCount(0);
  await expect(
    nav.getByRole("button", { name: "Competencies", exact: true }),
  ).toHaveCount(0);
  await expect(
    nav.getByRole("button", { name: "Categories", exact: true }),
  ).toHaveCount(0);
  await library(page);
  await page
    .getByLabel("Search competencies and skills", { exact: true })
    .fill("Active Listening");
  const group = page.getByRole("article", { name: "Communication competency" });
  await expect(
    group.getByText("Active Listening", { exact: true }),
  ).toBeVisible();
  await expect(group.getByText("Public Speaking", { exact: true })).toHaveCount(
    0,
  );
  await page
    .getByRole("button", { name: "Open Communication", exact: true })
    .click();
  await expect(
    group.getByText("Active Listening", { exact: true }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "Clear search", exact: true }).click();
  await page
    .getByLabel("Search competencies and skills globally")
    .fill("Excel Reporting");
  await page
    .getByLabel("Search competencies and skills globally")
    .press("Enter");
  await expect(
    page
      .getByRole("article", { name: "Data Analysis competency" })
      .getByText("Excel Reporting", { exact: true }),
  ).toBeVisible();
});
test("create competency and two skills together, preserving existing assignments", async ({
  page,
}) => {
  await settings(page);
  await page.getByRole("button", { name: "Add category", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Name").fill("Customer Experience");
  await page
    .getByRole("button", { name: "Save category", exact: true })
    .click();
  await library(page);
  await page
    .getByRole("button", { name: "Create competency", exact: true })
    .click();
  await page
    .getByLabel("Competency name", { exact: true })
    .fill("Customer Focus");
  await page
    .getByRole("dialog")
    .getByLabel("Category", { exact: true })
    .selectOption({ label: "Customer Experience" });
  await page.getByRole("button", { name: "Continue to skills" }).click();
  await page.getByLabel("Skill 1 name").fill("Customer Empathy");
  await page.getByRole("button", { name: "Add another skill" }).click();
  await page.getByLabel("Skill 2 name").fill("Service Recovery");
  await page.getByRole("button", { name: "Define proficiency" }).click();
  await page.getByRole("button", { name: "Save to library" }).click();
  await expect(page.getByRole("alert")).toContainText("describe Beginner");
  await proficiency(page, ["Customer Empathy", "Service Recovery"]);
  await page.getByRole("button", { name: "Save to library" }).click();
  const group = page.getByRole("article", {
    name: "Customer Focus competency",
  });
  await expect(
    group.getByText("Customer Empathy", { exact: true }),
  ).toBeVisible();
  await expect(
    group.getByText("Service Recovery", { exact: true }),
  ).toBeVisible();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("axle-competency-v1")!),
  );
  expect(stored.assignments).toEqual(seed.assignments);
  expect(
    stored.skills.filter(
      (s: any) =>
        s.competencyId ===
        stored.competencies.find((c: any) => c.name === "Customer Focus").id,
    ),
  ).toHaveLength(2);
  await page.reload();
  await library(page);
  await page.getByRole("button", { name: "Open Customer Focus" }).click();
  await expect(
    group.getByText("Customer Empathy", { exact: true }),
  ).toBeVisible();
  await settings(page);
  await expect(
    page.getByRole("button", { name: "Delete Customer Experience" }),
  ).toBeDisabled();
});
test("contextual skill editing inherits competency and category", async ({
  page,
}) => {
  await library(page);
  await page
    .getByRole("button", { name: "Open Communication", exact: true })
    .click();
  await page
    .getByRole("article", { name: "Communication competency" })
    .getByRole("button", { name: "Add skill", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByText("Skill in Communication", { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("combobox", { name: /Category|Competency/ }),
  ).toHaveCount(0);
  await dialog.getByLabel("Name").fill("Written Communication");
  for (const name of ["Beginner", "Intermediate", "Advanced", "Expert"])
    await dialog.getByLabel(name).fill(name + " writing ability");
  await page.getByRole("button", { name: "Save skill", exact: true }).click();
  await expect(
    page.getByText("Written Communication", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Delete Active Listening", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Edit Written Communication", exact: true })
    .click();
  await dialog.getByLabel("Name").fill("Business Writing");
  await page.getByRole("button", { name: "Save skill", exact: true }).click();
  await expect(
    page.getByText("Business Writing", { exact: true }),
  ).toBeVisible();
});
test("combined bulk upload previews new groups and imports together", async ({
  page,
}) => {
  await library(page);
  await page.getByRole("button", { name: "Bulk upload", exact: true }).click();
  const upload = page.getByLabel("CSV file");
  await upload.setInputFiles({
    name: "invalid.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      csv([
        header,
        [
          "Customer Focus",
          "",
          "Foundation",
          "Active Listening",
          "",
          "A",
          "B",
          "C",
          "D",
        ],
        [
          "Customer Focus",
          "",
          "Technical",
          "Service Recovery",
          "",
          "A",
          "B",
          "C",
          "D",
        ],
      ]),
    ),
  });
  await expect(
    page.getByRole("button", { name: "Import to library" }),
  ).toBeDisabled();
  await expect(
    page.getByText("Nothing has been saved.", { exact: false }),
  ).toBeVisible();
  await upload.setInputFiles({
    name: "library.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      csv([
        header,
        [
          "Customer Focus",
          "Customer development",
          "Foundation",
          "Customer Empathy",
          "",
          "A",
          "B",
          "C",
          "D",
        ],
        [
          "Customer Focus",
          "Customer development",
          "Foundation",
          "Service Recovery",
          "",
          "A",
          "B",
          "C",
          "D",
        ],
        [
          "Communication",
          "",
          "Foundation",
          "Written Communication",
          "",
          "A",
          "B",
          "C",
          "D",
        ],
      ]),
    ),
  });
  await expect(
    page.getByText("1 new competencies", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("3 new skills", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Import to library" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page
      .getByRole("article", { name: "Customer Focus competency" })
      .getByText("Service Recovery", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("article", { name: "Communication competency" })
      .getByText("Written Communication", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await library(page);
  await page.getByRole("button", { name: "Open Customer Focus" }).click();
  await expect(
    page.getByText("Customer Empathy", { exact: true }),
  ).toBeVisible();
});
test("creation cancellation saves nothing and draft supports adding skills later", async ({
  page,
}) => {
  await library(page);
  await page
    .getByRole("button", { name: "Create competency", exact: true })
    .click();
  await page.getByLabel("Competency name", { exact: true }).fill("Unfinished");
  await page
    .getByRole("dialog")
    .getByLabel("Category", { exact: true })
    .selectOption("foundation");
  await page.getByRole("button", { name: "Continue to skills" }).click();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Open Unfinished" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Create competency", exact: true })
    .click();
  await page
    .getByLabel("Competency name", { exact: true })
    .fill("Future Capability");
  await page
    .getByRole("dialog")
    .getByLabel("Category", { exact: true })
    .selectOption("foundation");
  await page.getByRole("button", { name: "Continue to skills" }).click();
  await page.getByRole("button", { name: /save as draft/ }).click();
  const group = page.getByRole("article", {
    name: "Future Capability competency",
  });
  await expect(group.getByText("Draft", { exact: true })).toBeVisible();
  await expect(
    group.getByRole("button", { name: "Add skill", exact: true }),
  ).toBeDisabled();
});
test("role mapping previews exact audience and saves skill assignments", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Role mapping", exact: true }).click();
  await page
    .getByRole("button", { name: "Create assignment", exact: true })
    .click();
  await page.getByLabel("Assignment name").fill("Sales Communication");
  await page
    .getByRole("checkbox", { name: "Communication", exact: true })
    .check();
  await page
    .getByRole("checkbox", { name: "Active Listening", exact: true })
    .check();
  await page
    .getByLabel("Expected level for Active Listening")
    .selectOption("l2");
  await page.getByLabel("Department", { exact: true }).selectOption("Sales");
  await page.getByRole("button", { name: "Review assignment" }).click();
  await expect(
    page.getByText("Ananya R., Meera S.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save & assign" }).click();
  await expect(
    page.getByText("Sales Communication", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Progress", exact: true }).click();
  await expect(page.getByText("Meera S.", { exact: true })).toBeVisible();
});
test("course sequence, proof rejection, resubmission and approval update progress", async ({
  page,
}) => {
  await page.getByLabel("Workspace view").selectOption("learner");
  const listening = page.locator(".cm-learning-card").filter({
    has: page.getByRole("heading", { name: "Active Listening", exact: true }),
  });
  await expect(listening.getByRole("button", { name: "Locked" })).toHaveCount(
    2,
  );
  await listening
    .getByRole("button", { name: "Submit proof", exact: true })
    .first()
    .click();
  await page.getByLabel("Certificate or document").setInputFiles({
    name: "certificate.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\nDemo certificate"),
  });
  await page.getByRole("button", { name: "Submit for review" }).click();
  await page.getByLabel("Workspace view").selectOption("manager");
  await page.getByRole("button", { name: "Reject with feedback" }).click();
  await expect(
    page.getByText("Add a reason so the learner knows what to do next."),
  ).toBeVisible();
  await page
    .getByPlaceholder("Required when rejecting evidence")
    .fill("Please include your name on the certificate.");
  await page.getByRole("button", { name: "Reject with feedback" }).click();
  await page.getByLabel("Workspace view").selectOption("learner");
  await expect(
    page.getByText("Rejected · Please include your name on the certificate."),
  ).toBeVisible();
  await listening
    .getByRole("button", { name: "Submit proof", exact: true })
    .first()
    .click();
  await page.getByLabel("Certificate or document").setInputFiles({
    name: "corrected.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\nNamed certificate"),
  });
  await page.getByRole("button", { name: "Submit for review" }).click();
  await page.getByLabel("Workspace view").selectOption("manager");
  await page.getByRole("button", { name: "Approve proof" }).click();
  await page.getByLabel("Workspace view").selectOption("learner");
  await expect(
    listening.getByText("Intermediate → Expert", { exact: true }),
  ).toBeVisible();
  await expect(listening.getByRole("button", { name: "Locked" })).toHaveCount(
    1,
  );
  await listening.getByRole("button", { name: "Complete demo course" }).click();
  await expect(
    listening.getByText("Advanced → Expert", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByLabel("Workspace view").selectOption("learner");
  await expect(
    listening.getByText("Advanced → Expert", { exact: true }),
  ).toBeVisible();
});
test("reports drill down to learner data and export CSV", async ({ page }) => {
  await page.getByRole("button", { name: "Reports", exact: true }).click();
  await page.getByLabel("Report type").selectOption("skill");
  await page.getByRole("button", { name: "1 learners" }).first().click();
  await expect(page.getByLabel("Report type")).toHaveValue("learner");
  await expect(page.getByText("Ananya R.", { exact: true })).toBeVisible();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV", exact: true }).click();
  const file = await pending;
  expect(file.suggestedFilename()).toBe("learner-report.csv");
});
test("mobile layout and dialog remain within viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Competency Management", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Create a competency", exact: true })
    .click();
  const rect = await page.getByRole("dialog").boundingBox();
  expect(rect!.x).toBeGreaterThanOrEqual(0);
  expect(rect!.x + rect!.width).toBeLessThanOrEqual(391);
  await page.screenshot({ path: "artifacts/mobile-form.png", fullPage: true });
});

test("bulk current-level update changes selected learners only", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Progress", exact: true }).click();
  await page
    .getByRole("checkbox", {
      name: "Select Ananya R. Active Listening",
      exact: true,
    })
    .check();
  await page
    .getByRole("checkbox", {
      name: "Select Ananya R. Public Speaking",
      exact: true,
    })
    .check();
  await page.getByLabel("Bulk current level").selectOption("l1");
  await page.getByRole("button", { name: "Update selected" }).click();
  await expect(
    page.getByLabel("Current level for Ananya R. Active Listening"),
  ).toHaveValue("l1");
  await expect(
    page.getByLabel("Current level for Ananya R. Public Speaking"),
  ).toHaveValue("l1");
  await expect(
    page.getByLabel("Current level for Rahul K. Excel Reporting"),
  ).toHaveValue("l2");
  await page.reload();
  await page.getByRole("button", { name: "Progress", exact: true }).click();
  await expect(
    page.getByLabel("Current level for Ananya R. Public Speaking"),
  ).toHaveValue("l1");
});
test("static assignments preserve audience and dynamic assignments include matching learners", () => {
  const data = structuredClone(seed),
    work = structuredClone(workflowSeed);
  const plan = {
    id: "p",
    name: "Sales",
    start: "2026-01-01",
    end: "2026-12-31",
    method: "Auto" as const,
    type: "Static" as const,
    department: "Sales",
    role: "",
    location: "",
    employeeIds: [],
    skills: [{ skillId: "excel", expected: "l3" }],
    status: "Active" as const,
    assignedNames: ["Ananya R."],
  };
  work.plans = [plan];
  const fixed = applyPlans(data, work, "2026-09-17");
  expect(fixed.data.assignments.some((a) => a.name === "Meera S.")).toBe(false);
  const dynamic = applyPlans(
    data,
    { ...work, plans: [{ ...plan, type: "Dynamic" }] },
    "2026-09-17",
  );
  expect(
    dynamic.data.assignments.some(
      (a) => a.name === "Meera S." && a.skillId === "excel",
    ),
  ).toBe(true);
  const future = applyPlans(
    data,
    { ...work, plans: [{ ...plan, start: "2026-12-01", type: "Dynamic" }] },
    "2026-09-17",
  );
  expect(future.data.assignments).toHaveLength(seed.assignments.length);
  const emptyStatic = applyPlans(
    data,
    { ...work, plans: [{ ...plan, assignedNames: [] }] },
    "2026-09-17",
  );
  expect(emptyStatic.data.assignments).toHaveLength(seed.assignments.length);
});
test("expanded merged library fits mobile and exposes proficiency descriptions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await library(page);
  await page
    .getByRole("button", { name: "Open Communication", exact: true })
    .click();
  const group = page.getByRole("article", { name: "Communication competency" });
  await group.locator("summary").first().click();
  await expect(
    group.getByText("Recognizes key points", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/merged-library-mobile.png",
    fullPage: true,
  });
});
