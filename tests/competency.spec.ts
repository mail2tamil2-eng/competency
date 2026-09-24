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
    .getByRole("button", { name: "Competency framework", exact: true })
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
  await page.getByRole("button", { name: "Done with this skill" }).click();
  await expect(page.getByRole("alert")).toContainText("describe Beginner");
  await proficiency(page, ["Customer Empathy"]);
  await page.getByRole("button", { name: "Done with this skill" }).click();
  await page.getByRole("button", { name: "Add another skill" }).click();
  await page.getByLabel("Skill 2 name").fill("Service Recovery");
  await page.getByRole("button", { name: "Review competency" }).click();
  await expect(page.getByRole("alert")).toContainText("describe Beginner");
  await proficiency(page, ["Service Recovery"]);
  await page.getByRole("button", { name: "Review competency" }).click();
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
    .getByRole("button", { name: "Communication", exact: true })
    .click();
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
  await page.getByRole("link", { name: "Proof submissions", exact: true }).click();
  await page.getByRole("button", { name: "Review proof for Ananya R. Listening with Intent" }).click();
  await page.getByRole("button", { name: "Reject with feedback" }).click();
  await expect(
    page.getByText("Add a reason so the learner knows what to do next."),
  ).toBeVisible();
  await page
    .getByPlaceholder("Required when rejecting evidence")
    .fill("Please include your name on the certificate.");
  await page.getByRole("button", { name: "Reject with feedback" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).first().click();
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
  await page.getByRole("link", { name: "Proof submissions", exact: true }).click();
  await page.getByRole("button", { name: "Review proof for Ananya R. Listening with Intent" }).click();
  await page.getByRole("button", { name: "Approve proof" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).first().click();
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
    .getByRole("button", { name: "Create competency", exact: true })
    .click();
  const rect = await page.getByRole("dialog").boundingBox();
  expect(rect!.x).toBeGreaterThanOrEqual(0);
  expect(rect!.x + rect!.width).toBeLessThanOrEqual(391);
  await page.screenshot({ path: "artifacts/mobile-form.png", fullPage: true });
});

test("bulk current-level update changes selected learners only after confirmation", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Progress", exact: true }).click();
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await page.getByRole("button", { name: "Bulk update", exact: true }).click();
  const reviewButton = page.getByRole("button", { name: "Review updates", exact: true });
  await reviewButton.hover({ force: true });
  await expect(reviewButton).toBeDisabled();
  await expect(reviewButton).toHaveCSS("background-color", "rgb(241, 245, 249)");
  await expect(reviewButton).toHaveCSS("color", "rgb(82, 97, 118)");
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
  const before = await page.evaluate(() =>
    localStorage.getItem("axle-competency-v1"),
  );
  await page
    .getByRole("button", { name: "Review updates", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "2 skill records across 1 learners",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("axle-competency-v1")),
  ).toBe(before);
  await page.getByRole("button", { name: "Back to selection" }).click();
  await page
    .getByRole("button", { name: "Review updates", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm updates", exact: true })
    .click();
  await page.reload();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("axle-competency-v1")!),
  );
  expect(
    stored.assignments
      .filter((a: any) => a.name === "Ananya R.")
      .every((a: any) => a.current === "l1"),
  ).toBe(true);
  expect(
    stored.assignments.find((a: any) => a.name === "Rahul K.").current,
  ).toBe("l2");
});
test("individual progress update is scoped to one learner and skill and requires saving", async ({
  page,
}) => {
  await page.evaluate(initial => localStorage.setItem("axle-competency-v1", JSON.stringify(initial)), seed);
  await page.reload();
  await page.getByRole("button", { name: "Progress", exact: true }).click();
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "View skills for Ananya R.",
      exact: true,
    }),
  ).toHaveCount(1);
  await page.screenshot({ path: "artifacts/learner-progress.png" });
  await page
    .getByRole("button", { name: "View skills for Ananya R.", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Communication");
  await page
    .getByRole("dialog")
    .screenshot({ path: "artifacts/learner-skills.png" });
  await page
    .getByRole("button", {
      name: "Update level for Ananya R. Active Listening",
      exact: true,
    })
    .click();
  await page.getByLabel("New current level").selectOption("l3");
  const before = await page.evaluate(
    () => JSON.parse(localStorage.getItem("axle-competency-v1")!).assignments,
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("axle-competency-v1")!).assignments,
    ),
  ).toEqual(before);
  await page
    .getByRole("button", {
      name: "Update level for Ananya R. Active Listening",
      exact: true,
    })
    .click();
  await page.getByLabel("New current level").selectOption("l3");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page
      .getByRole("dialog")
      .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
  await page.getByRole("button", { name: "Save level", exact: true }).click();
  await page.reload();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("axle-competency-v1")!),
  );
  const targetSkill = stored.skills.find(
    (s: any) => s.name === "Active Listening",
  ).id;
  const changed = stored.assignments.filter(
    (a: any) =>
      JSON.stringify(a) !==
      JSON.stringify(before.find((b: any) => b.id === a.id)),
  );
  expect(changed).toHaveLength(1);
  expect(changed[0]).toMatchObject({
    name: "Ananya R.",
    skillId: targetSkill,
    current: "l3",
  });
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

test("six skill cards keep proficiency attached through review and editing", async ({
  page,
}) => {
  await library(page);
  await page
    .getByRole("button", { name: "Create competency", exact: true })
    .click();
  await page
    .getByLabel("Competency name", { exact: true })
    .fill("Service Excellence");
  await page
    .getByRole("dialog")
    .getByLabel("Category", { exact: true })
    .selectOption("foundation");
  await page.getByRole("button", { name: "Continue to skills" }).click();
  for (let i = 1; i <= 6; i++) {
    if (i > 1)
      await page.getByRole("button", { name: "Add another skill" }).click();
    await page
      .getByLabel(`Skill ${i} name`, { exact: true })
      .fill(`Service skill ${i}`);
    await proficiency(page, [`Service skill ${i}`]);
    await expect(page.locator(".cm-create-skill-body")).toHaveCount(1);
    await page.getByRole("button", { name: "Done with this skill" }).click();
  }
  await expect(
    page.getByRole("status").filter({ hasText: "6 skills" }),
  ).toContainText("6 complete");
  await page.getByRole("button", { name: "Review competency" }).click();
  await page
    .locator(".cm-create-review summary")
    .filter({ hasText: "Service skill 3" })
    .click();
  await page
    .getByRole("button", { name: "Edit Service skill 3", exact: true })
    .click();
  await expect(
    page.getByLabel("Beginner for Service skill 3", { exact: true }),
  ).toHaveValue("Beginner ability in Service skill 3");
  await page
    .getByLabel("Beginner for Service skill 3", { exact: true })
    .fill("Unique revised description");
  await page.getByRole("button", { name: "Review competency" }).click();
  await page.getByRole("button", { name: "Save to library" }).click();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("axle-competency-v1")!),
  );
  const parent = stored.competencies.find(
    (c: any) => c.name === "Service Excellence",
  );
  const children = stored.skills.filter(
    (s: any) => s.competencyId === parent.id,
  );
  expect(children).toHaveLength(6);
  const beginner = stored.levels.find((l: any) => l.name === "Beginner").id;
  for (let i = 1; i <= 6; i++)
    expect(
      children.find((s: any) => s.name === `Service skill ${i}`).levels[
        beginner
      ],
    ).toBe(
      i === 3
        ? "Unique revised description"
        : `Beginner ability in Service skill ${i}`,
    );
});

test("partial proficiency is preserved when saving a skill as draft", async ({
  page,
}) => {
  await library(page);
  await page
    .getByRole("button", { name: "Create competency", exact: true })
    .click();
  await page
    .getByLabel("Competency name", { exact: true })
    .fill("Draft capability");
  await page
    .getByRole("dialog")
    .getByLabel("Category", { exact: true })
    .selectOption("foundation");
  await page.getByRole("button", { name: "Continue to skills" }).click();
  await page.getByLabel("Skill 1 name").fill("Draft ability");
  await page
    .getByLabel("Beginner for Draft ability", { exact: true })
    .fill("Initial ability");
  await page
    .getByRole("button", { name: "Save as draft", exact: true })
    .click();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("axle-competency-v1")!),
  );
  const skill = stored.skills.find((s: any) => s.name === "Draft ability");
  expect(skill.status).toBe("Draft");
  expect(Object.values(skill.levels)).toContain("Initial ability");
  expect(
    stored.competencies.find((c: any) => c.id === skill.competencyId).status,
  ).toBe("Draft");
});

test("assignment groups paginate skills and preserve selections across search", async ({
  page,
}) => {
  await page.evaluate((initial) => {
    const next = structuredClone(initial);
    for (let i = 1; i <= 20; i++)
      next.skills.push({
        id: `extra-${i}`,
        name: `Communication skill ${i}`,
        description: "Observable skill",
        status: "Active",
        competencyId: next.competencies.find((c) => c.name === "Communication")!
          .id,
        categoryId: "foundation",
        levels: {},
      });
    localStorage.setItem("axle-competency-v1", JSON.stringify(next));
  }, seed);
  await page.reload();
  await page.getByRole("button", { name: "Role mapping", exact: true }).click();
  await page
    .getByRole("button", { name: "Create assignment", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Communication", exact: true })
    .click();
  const group = page.getByRole("region", {
    name: "Communication competency",
    exact: true,
  });
  await expect(group.locator(".cm-assignment-skill")).toHaveCount(8);
  await group.getByRole("button", { name: "Select this page (8)" }).click();
  await page
    .getByLabel("Set level for selected skills in Communication")
    .selectOption("l2");
  await page.getByLabel("Next skills in Communication").click();
  await expect(group.getByRole("checkbox", { checked: true })).toHaveCount(0);
  await page
    .getByLabel("Search assignment competencies and skills")
    .fill("Communication skill 20");
  await page
    .getByRole("checkbox", { name: "Communication skill 20", exact: true })
    .check();
  await page
    .getByLabel("Expected level for Communication skill 20", { exact: true })
    .selectOption("l3");
  await page.getByLabel("Search assignment competencies and skills").fill("");
  await page.getByLabel("Selected only", { exact: true }).check();
  await expect(
    page.getByRole("status").filter({ hasText: "9 skills selected" }),
  ).toContainText("All selected levels set");
  await page.getByLabel("Assignment name").fill("Large skill assignment");
  await page.getByLabel("Department", { exact: true }).selectOption("Sales");
  await page
    .getByRole("button", { name: "Review assignment", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Communication competency", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Next skills in Communication").click();
  await expect(
    page.getByText("Communication skill 20", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Save & assign", exact: true })
    .click();
  const plan = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("axle-competency-v1")!).workflow.plans.find(
      (p: any) => p.name === "Large skill assignment",
    ),
  );
  expect(plan.skills).toHaveLength(9);
  expect(plan.skills.find((s: any) => s.skillId === "extra-20").expected).toBe(
    "l3",
  );
  expect(plan.skills.filter((s: any) => s.expected === "l2")).toHaveLength(8);
});

test("assignment hierarchy fits desktop and mobile", async ({ page }) => {
  await page.getByRole("button", { name: "Role mapping", exact: true }).click();
  await page
    .getByRole("button", { name: "Create assignment", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Communication", exact: true })
    .click();
  await page
    .getByRole("checkbox", { name: "Active Listening", exact: true })
    .check();
  await page
    .getByLabel("Expected level for Active Listening")
    .selectOption("l2");
  await page
    .getByRole("region", { name: "Communication competency", exact: true })
    .screenshot({ path: "artifacts/assignment-hierarchy.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  const dialog = page.getByRole("dialog");
  expect(
    await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
  await page
    .getByRole("checkbox", { name: "Public Speaking", exact: true })
    .check();
  await page
    .getByLabel("Expected level for Public Speaking")
    .selectOption("l3");
  await page
    .getByRole("region", { name: "Communication competency", exact: true })
    .screenshot({ path: "artifacts/assignment-hierarchy-mobile.png" });
});
