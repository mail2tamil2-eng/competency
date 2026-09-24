import { test, expect } from "@playwright/test";
import { seed } from "../src/app/competency/model";
import { workflowSeed } from "../src/app/competency/workflowModel";
import {
  managerLevel,
  reviewProof,
  skillGap,
} from "../src/app/competency/managerModel";
import ExcelJS from "exceljs";

test.beforeEach(async ({ page }) => {
  await page.goto(process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:5190");
  await page.evaluate(
    ({ seed, workflowSeed }) => {
      localStorage.clear();
      const data = structuredClone(seed),
        work = structuredClone(workflowSeed);
      data.assignments[0].assignedDate = "2026-09-01";
      work.proofs = [
        {
          id: "proof-1",
          assignmentId: "a1",
          courseId: "c1",
          levelId: "l1",
          fileName: "listening-proof.png",
          document:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
          status: "Under Review",
          remarks: "",
          submitted: "2026-09-20",
        },
      ];
      localStorage.setItem(
        "axle-competency-v1",
        JSON.stringify({ ...data, workflow: work }),
      );
    },
    { seed, workflowSeed },
  );
  await page.reload();
  await page.getByLabel("Workspace view").selectOption("manager");
});

test("manager summary, all reportees and detailed view retain meaningful context", async ({
  page,
}) => {
  await expect(
    page.getByRole("link", { name: "Team overview", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByText("REPORTING MANAGER", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Review pending proofs/ }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "View all", exact: true }).click();
  await expect(page).toHaveURL(/\/manager\/reportees$/);
  await expect(
    page.getByRole("navigation", { name: "Competency sections" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "Manager pages" }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "All reportees" }),
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/manager$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/manager\/reportees$/);
  await page.getByLabel("Search team progress").fill("ananya.r@example.com");
  await expect(
    page.getByRole("button", { name: "View skills for Rahul K." }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "View skills for Ananya R." }).click();
  await expect(
    page.getByRole("heading", { name: "Ananya R. — Skills & progress" }),
  ).toBeVisible();
  const listening = page.getByRole("row").filter({
    has: page.getByRole("button", {
      name: "Update level for Active Listening",
      exact: true,
    }),
  });
  await expect(listening).toContainText("3");
  await expect(listening).toContainText("Beginner");
  await expect(listening).toContainText("Expert");
  await expect(
    page.getByRole("button", { name: "Active Listening", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("columnheader", { name: "Assigned date", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Completed date", exact: true }),
  ).toBeVisible();
  await expect(listening).toContainText("01 Sept 2026");
  await page
    .getByRole("button", { name: "Back to all reportees", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "All reportees", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Competency sections" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "Manager pages" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "View skills for Ananya R.", exact: true })
    .click();
  await expect(
    page.getByRole("row").filter({
      has: page.getByRole("button", {
        name: "Update level for Public Speaking",
        exact: true,
      }),
    }),
  ).toContainText("Not assessed");
  await page.screenshot({
    path: "artifacts/manager-detailed.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await page.screenshot({
    path: "artifacts/manager-mobile.png",
    fullPage: true,
  });
});

test("manager compact dialog saves one proficiency with audit and completion date without completing courses", async ({
  page,
}) => {
  await page.getByRole("button", { name: "View skills for Ananya R." }).click();
  await page
    .getByRole("button", {
      name: "Update level for Active Listening",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", { name: "Save level", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("dialog").locator(".cm-manager-levels"),
  ).toHaveCount(0);
  await expect(page.getByLabel("Remarks (optional)")).toBeVisible();
  await page.getByLabel("New current level").selectOption("l3");
  await expect(
    page.getByRole("button", { name: "Save level", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  let data = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("axle-competency-v1")!),
  );
  expect(data.assignments[0].current).toBe("l0");
  await page
    .getByRole("button", {
      name: "Update level for Active Listening",
      exact: true,
    })
    .click();
  await page.getByLabel("New current level").selectOption("l3");
  await page
    .getByLabel("Remarks (optional)")
    .fill("Demonstrated expert coaching during the assessment.");
  await page
    .getByRole("dialog")
    .screenshot({ path: "artifacts/manager-level.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page
      .getByRole("dialog")
      .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
  await page.getByRole("button", { name: "Save level", exact: true }).click();
  await page.reload();
  data = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("axle-competency-v1")!),
  );
  expect(data.assignments[0]).toMatchObject({
    current: "l3",
    updatedBy: "Manager",
  });
  expect(data.assignments[0].completedDate).toBeTruthy();
  expect(data.assignments[0].levelHistory).toHaveLength(1);
  expect(data.assignments[0].levelHistory[0].reason).toBe(
    "Demonstrated expert coaching during the assessment.",
  );
  expect(data.workflow.completed).toEqual({});
  expect(data.assignments[2].current).toBe("");
  await page
    .getByRole("button", {
      name: "Update level for Active Listening",
      exact: true,
    })
    .click();
  await page.locator(".cm-manager-history summary").click();
  await expect(page.locator(".cm-manager-history")).toContainText(
    "Beginner → Expert",
  );
  await expect(page.locator(".cm-manager-history")).toContainText(
    "Demonstrated expert coaching during the assessment.",
  );
});

test("manager reviews evidence and persists approval without changing other courses", async ({
  page,
}) => {
  await page
    .getByRole("link", { name: "Proof submissions", exact: true })
    .click();
  await page.getByLabel("Filter proof status").selectOption("Under Review");
  await expect(page.getByLabel("Filter proof status")).toHaveValue(
    "Under Review",
  );
  await expect(page).toHaveURL(/\/manager\/proofs\?status=/);
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Proof submissions", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("link", { name: "Team overview", exact: true }),
  ).not.toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("button", { name: "Back to team overview" }),
  ).toHaveCount(0);
  await expect(
    page.getByText("REPORTING MANAGER", { exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: "artifacts/manager-proof-submissions.png",
    fullPage: true,
  });
  await page
    .getByRole("button", {
      name: "Review proof for Ananya R. Listening with Intent",
    })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Listening with Intent");
  await expect(
    page.getByRole("img", { name: /Submitted evidence/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reject with feedback" }).click();
  await expect(page.getByRole("alert")).toContainText("Add a reason");
  await page
    .getByRole("dialog")
    .screenshot({ path: "artifacts/manager-proof.png" });
  await page
    .getByRole("button", { name: "Approve proof", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Approve proof", exact: true }),
  ).toHaveCount(0);
  await page.reload();
  const data = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("axle-competency-v1")!),
  );
  expect(data.assignments[0].current).toBe("l1");
  expect(data.workflow.completed.a1).toEqual(["c1"]);
  expect(data.workflow.proofs[0]).toMatchObject({
    status: "Approved",
    reviewedBy: "Manager",
  });
});

test("manager rejection retains proficiency and records feedback", async ({
  page,
}) => {
  await page
    .getByRole("link", { name: "Proof submissions", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Review proof for Ananya R. Listening with Intent",
    })
    .click();
  await page
    .getByLabel("Review feedback")
    .fill("Please provide a certificate with your name.");
  await page.getByRole("button", { name: "Reject with feedback" }).click();
  await page
    .getByRole("button", { name: "Close", exact: true })
    .first()
    .click();
  await expect(
    page
      .getByRole("row")
      .filter({ hasText: "Listening with Intent" })
      .getByText("Rejected", { exact: true }),
  ).toBeVisible();
  const data = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("axle-competency-v1")!),
  );
  expect(data.assignments[0].current).toBe("l0");
  expect(data.workflow.proofs[0].remarks).toContain("with your name");
});

test("manager exports filtered CSV and valid XLSX with the same detailed records", async ({
  page,
}) => {
  await page.getByRole("button", { name: "View all", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "All reportees" }),
  ).toBeVisible();
  await page.getByLabel("Filter competency").selectOption("communication");
  await expect(page.getByLabel("Filter competency")).toHaveValue(
    "communication",
  );
  for (const format of ["CSV", "XLSX"]) {
    const pending = page.waitForEvent("download");
    await page
      .getByRole("button", { name: `Export ${format}`, exact: true })
      .click();
    const file = await pending;
    expect(file.suggestedFilename()).toBe(
      `team-skill-progress-detailed.${format.toLowerCase()}`,
    );
    if (format === "XLSX") {
      const book = new ExcelJS.Workbook();
      await book.xlsx.readFile((await file.path())!);
      const sheet = book.worksheets[0];
      expect(sheet.rowCount).toBe(3);
      expect(sheet.getCell("A2").value).toBe("Ananya R.");
      expect(sheet.getCell("H2").value).toBe(3);
      expect(sheet.getCell("H3").value).toBe("Not assessed");
      expect(sheet.getCell("I2").value).toBe("Under Review");
    } else {
      const stream = await file.createReadStream();
      const chunks = [];
      for await (const chunk of stream!) chunks.push(chunk);
      const text = Buffer.concat(chunks).toString("utf8");
      expect(text).toContain("Active Listening");
      expect(text).not.toContain("Rahul");
    }
  }
});

test("manager model rejects lower or unchanged levels and duplicate reviews", () => {
  expect(skillGap(seed, seed.assignments[2])).toBeNull();
  const promoted = managerLevel(seed, seed.assignments[0], "l3", "Assessment");
  expect(() =>
    managerLevel(promoted, promoted.assignments[0], "l1", "Reassessment"),
  ).toThrow("higher than the current level");
  expect(() =>
    managerLevel(promoted, promoted.assignments[0], "l3", "Same level"),
  ).toThrow("higher than the current level");
  expect(promoted.assignments[0].completedDate).toBeTruthy();
  const work = structuredClone(workflowSeed);
  work.proofs = [
    {
      id: "p",
      assignmentId: "a1",
      courseId: "c1",
      fileName: "p.pdf",
      document: "",
      status: "Under Review",
      remarks: "",
      submitted: "2026-09-01",
    },
  ];
  const next = reviewProof(promoted, work, "p", true, "");
  expect(next.data.assignments[0].current).toBe("l3");
  expect(() => reviewProof(next.data, next.work, "p", true, "")).toThrow(
    "no longer awaiting review",
  );
});

test("manager table pages paginate more than ten records and only offer higher levels", async ({
  page,
}) => {
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("axle-competency-v1")!);
    for (let i = 0; i < 12; i++) {
      data.assignments.push({
        ...data.assignments[0],
        id: `person-${i}`,
        name: `Reportee ${i}`,
        employeeId: `person-${i}`,
      });
      data.skills.push({
        ...data.skills[0],
        id: `skill-${i}`,
        name: `Additional skill ${i}`,
      });
      data.assignments.push({
        ...data.assignments[0],
        id: `assignment-${i}`,
        skillId: `skill-${i}`,
      });
    }
    localStorage.setItem("axle-competency-v1", JSON.stringify(data));
  });
  await page.reload();
  await page.getByRole("button", { name: "View all", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "All reportees", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".cm-manager-stats")).toHaveCount(0);
  await expect(
    page.getByText("REPORTING MANAGER", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("tbody tr")).toHaveCount(10);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await expect(
    page.getByRole("button", { name: "Page 2 of 2", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page
    .getByRole("combobox", { name: "Entries per page" })
    .selectOption("25");
  await expect(page.locator("tbody tr")).toHaveCount(14);
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("combobox", { name: "Entries per page" })
    .selectOption("10");
  await page.getByRole("button", { name: "Page 2 of 2", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await expect(page.locator(".cm-platform-pagination")).toHaveCSS(
    "font-size",
    "16px",
  );
  await expect(page.locator(".cm-platform-pagination .is-current")).toHaveCSS(
    "background-color",
    "rgb(36, 99, 214)",
  );
  await expect(page.locator(".cm")).toHaveCSS(
    "font-family",
    '"Nunito Sans", sans-serif',
  );
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await page.getByRole("button", { name: "View skills for Ananya R." }).click();
  await expect(
    page.getByRole("heading", { name: "Ananya R. — Skills & progress" }),
  ).toBeVisible();
  await expect(
    page.locator(".cm-manager-stats, .cm-manager-person"),
  ).toHaveCount(0);
  await expect(page.locator("tbody tr")).toHaveCount(10);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Update level for Active Listening",
      exact: true,
    })
    .click();
  await expect(
    page.getByLabel("New current level").locator("option:not([disabled])"),
  ).toHaveText(["Intermediate", "Advanced", "Expert"]);
  await page.getByLabel("New current level").selectOption("l3");
  await page.getByRole("button", { name: "Save level", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Update level for Active Listening",
      exact: true,
    })
    .click();
  await expect(
    page.getByLabel("New current level").locator("option:not([disabled])"),
  ).toHaveCount(0);
  await expect(
    page.getByLabel("New current level").locator('option[value="l0"]'),
  ).toHaveText("Beginner — Completed");
  await expect(
    page.getByLabel("New current level").locator('option[value="l3"]'),
  ).toHaveText("Expert — Completed");
  await expect(
    page.getByRole("button", { name: "Save level", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText(/already at the highest available active level/),
  ).toBeVisible();
  const disabledSave = page.getByRole("button", { name: "Save level", exact: true });
  await disabledSave.hover({ force: true });
  await expect(disabledSave).toHaveCSS("background-color", "rgb(241, 245, 249)");
  await expect(disabledSave).toHaveCSS("color", "rgb(82, 97, 118)");
});
