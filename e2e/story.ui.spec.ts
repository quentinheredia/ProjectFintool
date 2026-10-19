import { expect, test, type Page } from "@playwright/test";

test.use({ reducedMotion: "reduce" });

async function openStory(page: Page, query: string) {
  await page.goto(`/?${query}`);
  await page.locator("[data-carousel-ready]").waitFor();
}

test("landing form submits to a shareable story deck", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Birth year").fill("1996");
  await page.getByLabel("Annual income").fill("65000");
  await expect(page.getByLabel("Annual income")).toHaveValue("65,000");
  await page.getByRole("button", { name: "Compare" }).click();
  await expect(page).toHaveURL(/by=1996&inc=65000&mode=parent_peer/);
  await expect(page.getByText("Card 1 of 7", { exact: false })).toBeAttached();
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
