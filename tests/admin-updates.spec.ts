import { test, expect } from "@playwright/test";
import { seed } from "../src/app/competency/model";
import {
  workflowSeed,
  applyPlans,
  matching,
  Plan,
} from "../src/app/competency/workflowModel";
import {
  learnerReportHeaders,
  learnerReportRows,
} from "../src/app/competency/AdminReports";

test.beforeEach(async ({ page }) => {
  await page.goto(process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:5190");
  await page.evaluate(
    ({ seed, workflowSeed }) => {
      const data = structuredClone(seed),
        work = structuredClone(workflowSeed);
      work.employees[0].managerId = "e3";
      work.employees[0].cohort = "Sales 2026";
      for (let i = 0; i < 1002; i++)
        work.employees.push({
          id: `user-${i}`,
          name: `Learner ${i}`,
          email: `learner${i}@example.com`,
          department: i % 2 ? "Sales" : "Support",
          role: "Executive",
          location: "Chennai",
          cohort: i % 2 ? "Sales 2026" : "Support 2026",
        });
      data.assignments[0].employeeId = "e1";
      data.assignments[0].assignedDate = "2026-09-01";
      localStorage.setItem(
        "axle-competency-v1",
        JSON.stringify({ ...data, workflow: work }),
      );
    },
    { seed, workflowSeed },
  );
  await page.reload();
});

test("manual selection supports 1000 users, persistent filters, review and no end date", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Role mapping", exact: true }).click();
  await page
    .getByRole("button", { name: "Create assignment", exact: true })
    .click();
  await page
    .getByLabel("Assignment name", { exact: true })
    .fill("Large manual assignment");
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
    .getByLabel("Enrolment method", { exact: true })
    .selectOption("Manual");
  await expect(
    page.getByLabel("Enrolment type", { exact: true }),
  ).toBeDisabled();
  await expect(page.getByLabel("Location", { exact: true })).toHaveCount(0);
  const region = page.getByRole("region", {
    name: "Manual learner selection",
    exact: true,
  });
  await expect(region.locator("tbody tr")).toHaveCount(10);
  await region
    .getByLabel("Filter learners by cohort")
    .selectOption("Support 2026");
  await region
    .getByRole("button", { name: "Select this page (10)", exact: true })
    .click();
  await region.getByRole("button", { name: "Next", exact: true }).click();
  await region
    .getByRole("checkbox", { name: "Select Learner 20 (user-20)", exact: true })
    .check();
  await region
    .getByLabel("Search learners", { exact: true })
    .fill("learner1000@example.com");
  await expect(region.locator("tbody tr")).toHaveCount(1);
  await region
    .getByRole("button", { name: "Select all matching (1)", exact: true })
    .click();
  await expect(
    region.getByText("12 learners selected", { exact: true }),
  ).toBeVisible();
  await region.getByLabel("Search learners", { exact: true }).fill("");
  await region
    .getByRole("checkbox", { name: "Selected learners only", exact: true })
    .check();
  await expect(
    region.getByText("12 matching users", { exact: true }),
  ).toBeVisible();
  await region
    .getByRole("button", { name: "Select all matching (12)", exact: true })
    .click();
  await expect(
    region.getByText("12 learners selected", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("checkbox", { name: "Set end date", exact: true })
    .check();
  await expect(page.getByLabel("End date", { exact: true })).toBeVisible();
  await page
    .getByRole("checkbox", { name: "Set end date", exact: true })
    .uncheck();
  await expect(page.getByLabel("End date", { exact: true })).toHaveCount(0);
  await page
    .getByRole("button", { name: "Review assignment", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("No end date");
  await page
    .getByRole("button", { name: "Save & assign", exact: true })
    .click();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("axle-competency-v1")!),
  );
  expect(saved.workflow.plans[0].employeeIds).toHaveLength(12);
  expect(saved.workflow.plans[0].end).toBe("");
  expect(
    saved.assignments.filter((a: any) => a.employeeId?.startsWith("user-")),
  ).toHaveLength(12);
  await page.reload();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("axle-competency-v1")!).assignments
          .length,
    ),
  ).toBe(saved.assignments.length);
});

test("select all matching is explicit and assignment controls fit mobile", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Role mapping", exact: true }).click();
  await page
    .getByRole("button", { name: "Create assignment", exact: true })
    .click();
  await expect(
    page.getByText(
      "The system automatically enrols users based on the defined profile.",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByLabel("Enrolment type", { exact: true })
    .selectOption("Dynamic");
  await expect(
    page.getByText(
      "Skills are assigned to existing and new users who match the defined profile.",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByLabel("Enrolment method", { exact: true })
    .selectOption("Manual");
  const region = page.getByRole("region", {
    name: "Manual learner selection",
    exact: true,
  });
  await region
    .getByRole("button", { name: "Select all matching (1005)", exact: true })
    .click();
  await expect(
    region.getByText("1005 learners selected", { exact: true }),
  ).toBeVisible();
  await region
    .getByRole("button", { name: "Clear selection", exact: true })
    .click();
  await expect(
    region.getByText("0 learners selected", { exact: true }),
  ).toBeVisible();
  await region.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "artifacts/manual-enrolment-desktop.png",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  expect(
    await page
      .getByRole("dialog")
      .evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "Review assignment", exact: true }),
  ).toBeInViewport();
  await page.screenshot({
    path: "artifacts/manual-enrolment-mobile.png",
    animations: "disabled",
  });
});

test("reports expose only two types and export all required learner columns", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Reports", exact: true }).click();
  await expect(page.getByLabel("Report type").locator("option")).toHaveText([
    "Skill-wise learner progress",
    "Learner-wise skill report",
  ]);
  await page.getByLabel("Report type").selectOption("learner");
  await expect(page.locator("thead th")).toHaveText(learnerReportHeaders);
  await page.getByLabel("Search report").fill("ananya.r@example.com");
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await expect(page.locator("tbody tr").first()).toContainText("Meera S.");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV", exact: true }).click();
  const stream = await (await pending).createReadStream();
  let csv = "";
  for await (const chunk of stream!) csv += chunk.toString();
  for (const header of learnerReportHeaders) expect(csv).toContain(header);
  expect(csv).toContain("2026-09-01");
  expect(csv).toContain("Meera S.");
  expect(csv).not.toContain("Rahul K.");
  await page.screenshot({
    path: "artifacts/admin-learner-report.png",
    animations: "disabled",
  });
});

test("cohort matching, optional end date and identity-based static assignments", () => {
  const work = structuredClone(workflowSeed);
  work.employees = [
    {
      id: "a",
      name: "Same name",
      email: "a@example.com",
      department: "Sales",
      role: "Executive",
      location: "",
      cohort: "Intake A",
    },
    {
      id: "b",
      name: "Same name",
      email: "b@example.com",
      department: "Sales",
      role: "Executive",
      location: "",
      cohort: "Intake B",
    },
  ];
  const plan: Plan = {
    id: "p",
    name: "Cohort",
    start: "2026-01-01",
    end: "",
    method: "Auto",
    type: "Static",
    department: "",
    role: "",
    location: "",
    cohort: "Intake A",
    employeeIds: [],
    assignedNames: ["Same name"],
    assignedEmployeeIds: ["a"],
    skills: [{ skillId: "speaking", expected: "l2" }],
    status: "Active",
  };
  expect(matching(work, plan).map((e) => e.id)).toEqual(["a"]);
  work.plans = [plan];
  const data = { ...structuredClone(seed), assignments: [] };
  expect(
    applyPlans(data, work, "2027-01-01").data.assignments.map(
      (a) => a.employeeId,
    ),
  ).toEqual(["a"]);
  work.employees[1].cohort = "Intake A";
  expect(applyPlans(data, work, "2027-01-01").data.assignments).toHaveLength(1);
  plan.type = "Dynamic";
  expect(applyPlans(data, work, "2027-01-01").data.assignments).toHaveLength(2);
  plan.end = "2026-12-31";
  expect(applyPlans(data, work, "2027-01-01").data.assignments).toHaveLength(0);
  const rows = learnerReportRows(seed, workflowSeed);
  expect(rows[0].cells[9]).toBe(3);
});
