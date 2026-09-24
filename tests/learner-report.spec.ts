import { test, expect } from "@playwright/test";
import { seed } from "../src/app/competency/model";

test("learner report preserves identity, shows gaps and dates, and filters paginated skills", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:5190");
  await page.evaluate((seed) => {
    const data = structuredClone(seed);
    data.assignments[0].assignedDate = "2026-09-01";
    data.assignments.push({
      ...data.assignments[0],
      id: "other-person",
      employeeId: "other",
      name: "Ananya R.",
      skillId: "excel",
      department: "Support",
    });
    for (let i = 0; i < 11; i++)
      data.assignments.push({
        ...data.assignments[0],
        id: `extra-${i}`,
        current: "l3",
        completedDate: "2026-09-24",
      });
    localStorage.setItem("axle-competency-v1", JSON.stringify(data));
  }, seed);
  await page.reload();
  await page.getByLabel("Workspace view").selectOption("learner");
  await page
    .getByLabel("Preview learner")
    .selectOption({ label: "Rahul K. · Support" });
  await page
    .getByRole("button", { name: "Skill progress report", exact: true })
    .click();
  await expect(page).toHaveURL(/learner\/report$/);
  await expect(
    page.getByLabel("Preview learner").locator("option:checked"),
  ).toHaveText("Rahul K. · Support");
  await expect(page.locator("thead th")).toHaveText([
    "Assigned skill",
    "Current level",
    "Expected level",
    "Skill gap",
    "Assigned date",
    "Completed date",
    "Status",
  ]);
  await page
    .getByLabel("Preview learner")
    .selectOption({ label: "Ananya R. · Sales" });
  await expect(page.locator("tbody tr")).toHaveCount(10);
  await expect(
    page.locator("tbody tr").first().locator("td").nth(3),
  ).toHaveText("3");
  await expect(page.locator("tbody tr").first()).toContainText("2026-09-01");
  await expect(page.locator("tbody")).not.toContainText("Excel Reporting");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(3);
  await page.getByLabel("Filter skill status").selectOption("Completed");
  await expect(
    page.locator("tbody tr").first().locator("td").nth(3),
  ).toHaveText("0");
  await expect(page.locator("tbody tr").first()).toContainText("2026-09-24");
  await page.getByLabel("Filter skill status").selectOption("Yet to Start");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody tr")).toContainText("Not assessed");
  await page.getByLabel("Filter skill status").selectOption("");
  await page.screenshot({
    path: "artifacts/learner-skill-report.png",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    )
    .toBe(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "My skill progress report" }),
  ).toBeVisible();
  await expect(page.getByLabel("Workspace view")).toHaveValue("learner");
});
