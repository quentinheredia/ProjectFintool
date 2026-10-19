import { expect, test } from "@playwright/test";

test("lists occupations with their data status", async ({ request }) => {
  const response = await request.get("/api/industries");
  expect(response.status()).toBe(200);
  const { occupations } = await response.json();
  expect(occupations).toContainEqual(expect.objectContaining({ id: "gov_it", status: "placeholder" }));
});

test("compares an occupation against the 1980s by default", async ({ request }) => {
  const response = await request.get("/api/industries/compare?occupation=engineer");
  expect(response.status()).toBe(200);
  const comparison = await response.json();
  expect(comparison).toMatchObject({ thenYear: 1985, occupation: { id: "engineer" } });
  expect(comparison.measures).toHaveLength(4);
});

test("rejects an unknown occupation with 404", async ({ request }) => {
  expect((await request.get("/api/industries/compare?occupation=astronaut")).status()).toBe(404);
});

test("rejects a then year outside the data with 400", async ({ request }) => {
  expect((await request.get("/api/industries/compare?occupation=engineer&then=1900")).status()).toBe(400);
});
