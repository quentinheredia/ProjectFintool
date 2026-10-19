import { expect, test, type Page } from "@playwright/test";

test.use({ reducedMotion: "reduce" });

async function openStory(page: Page, query: string) {
  await page.goto(`/?${query}`);
  await page.locator("[data-carousel-ready]").waitFor();
}

test("the landing leads through the sample tour to the sandbox", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "See the comparison" }).click();
  await expect(page).toHaveURL(/\/tour$/);
  await page.locator("[data-carousel-ready]").waitFor();
  for (let card = 2; card <= 7; card++) {
    await page.keyboard.press("ArrowRight");
    await expect(page.getByText(`Card ${card} of 7`, { exact: false })).toBeAttached();
  }
  await page.getByRole("link", { name: "Compare with your numbers" }).click();
  await expect(page).toHaveURL(/\/sandbox/);
});

test("the sandbox updates live and plays as a story", async ({ page }) => {
  await page.goto("/sandbox");
  await page.getByLabel("Your birth year").selectOption("2005");
  await page.getByText("Student", { exact: true }).click();
  await page.getByRole("button", { name: /^Top 1%/ }).click();
  await expect(page).toHaveURL(/by=2005&inc=794129&mode=parent_peer&emp=student&start=\d{4}/);
  await expect(page.getByText("against your parent in", { exact: false })).toContainText("born 1975, assumed");
  await page.getByRole("link", { name: "Play your story" }).click();
  await expect(page).toHaveURL(/\/\?by=2005&inc=794129/);
  await expect(page.getByText("Card 1 of 7", { exact: false })).toBeAttached();
});

test("an invalid share link opens the sandbox", async ({ page }) => {
  await page.goto("/?by=1800&inc=5");
  await expect(page).toHaveURL(/\/sandbox/);
  await expect(page.getByRole("heading", { name: "Your comparison, live" })).toBeVisible();
});

test("keyboard arrows move between cards", async ({ page }) => {
  await openStory(page, "by=1996&inc=65000");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText(/Card 2 of 7/)).toBeAttached();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByText(/Card 1 of 7/)).toBeAttached();
});

test("share dialog previews the active card in both formats", async ({ page }) => {
  await openStory(page, "by=1996&inc=65000");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText(/Card 2 of 7/)).toBeAttached();
  await page.getByRole("button", { name: "Share this card" }).click();

  const dialog = page.getByRole("dialog", { name: "Share this card" });
  await expect(dialog).toBeVisible();
  const preview = dialog.getByRole("img");
  await expect(preview).toHaveAttribute("src", /card=2&fmt=story/);
  await expect.poll(() => preview.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(1080);

  await dialog.getByRole("button", { name: "16:9 Post" }).click();
  await expect(preview).toHaveAttribute("src", /fmt=social/);
  await expect(dialog.getByRole("link", { name: "Download PNG" })).toHaveAttribute("download", "parity-card-2-social.png");

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
