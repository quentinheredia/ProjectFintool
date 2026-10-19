import { expect, test } from "@playwright/test";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];
const WARM_RENDER_BUDGET_MS = 800;

/** Reads width and height from the PNG IHDR chunk. */
function pngSize(buffer: Buffer): { width: number; height: number } {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

const FORMATS = [
  { fmt: "story", width: 1080, height: 1920 },
  { fmt: "social", width: 1200, height: 630 },
] as const;

for (const { fmt, width, height } of FORMATS) {
  for (let card = 1; card <= 7; card++) {
    test(`card ${card} renders a ${width}x${height} ${fmt} PNG`, async ({ request }) => {
      const response = await request.get(`/api/og/card?by=1995&inc=72000&card=${card}&fmt=${fmt}`);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toBe("image/png");
      const body = await response.body();
      expect([...body.subarray(0, 4)]).toEqual(PNG_SIGNATURE);
      expect(pngSize(body)).toEqual({ width, height });
    });
  }
}

test("renders extreme incomes without failing", async ({ request }) => {
  const response = await request.get("/api/og/card?by=1960&inc=10000000&mode=custom&year=1965&card=7&fmt=story");
  expect(response.status()).toBe(200);
});

test("a warm render stays within the latency budget", async ({ request }) => {
  const path = "/api/og/card?by=1996&inc=65000&card=2&fmt=story&warm=1";
  await request.get(path);
  const startedAt = Date.now();
  const response = await request.get(`${path}&t=${startedAt}`);
  expect(response.status()).toBe(200);
  expect(Date.now() - startedAt).toBeLessThan(WARM_RENDER_BUDGET_MS);
});

const INVALID_REQUESTS = [
  ["missing inputs", ""],
  ["out-of-range birth year", "by=1900&inc=65000"],
  ["unknown card", "by=1996&inc=65000&card=9"],
  ["unknown format", "by=1996&inc=65000&fmt=square"],
] as const;

for (const [description, query] of INVALID_REQUESTS) {
  test(`rejects ${description} with 400`, async ({ request }) => {
    const response = await request.get(`/api/og/card?${query}`);
    expect(response.status()).toBe(400);
  });
}
