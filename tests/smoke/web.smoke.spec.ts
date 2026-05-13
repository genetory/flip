import { expect, test } from "@playwright/test";

const apiURL = process.env.SMOKE_API_URL ?? "https://staging-api.aply.global";

test.describe("home", () => {
  test("home page loads", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status(), "home should respond 200").toBe(200);
    await expect(page).toHaveTitle(/Aply/i);
  });
});

test.describe("auth surface", () => {
  test("login page renders with OAuth options", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("body")).toContainText(/aply/i);
    // 4 OAuth providers should be present somewhere on login UI
    const providerHits = await Promise.all(
      ["naver", "google", "kakao"].map((p) =>
        page
          .locator(`[data-provider="${p}"], img[alt*="${p}" i], button:has-text("${p}")`)
          .first()
          .isVisible()
          .catch(() => false)
      )
    );
    expect(providerHits.filter(Boolean).length, "at least one OAuth button visible").toBeGreaterThan(0);
  });

  test("signup page renders", async ({ page }) => {
    const response = await page.goto("/signup");
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toContainText(/aply/i);
  });
});

test.describe("positions", () => {
  test("positions list page loads", async ({ page }) => {
    const response = await page.goto("/positions");
    expect(response?.status()).toBeLessThan(500);
  });
});

test.describe("api health", () => {
  test("api /health returns ok=true with db connected", async ({ request }) => {
    const response = await request.get(`${apiURL}/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.db).toBe("connected");
  });

  test("api /positions returns valid json shape", async ({ request }) => {
    const response = await request.get(`${apiURL}/positions?limit=5&sort=latest`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("api /positions/meta returns valid shape", async ({ request }) => {
    const response = await request.get(`${apiURL}/positions/meta`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body).toHaveProperty("partnerIndustries");
    expect(body).toHaveProperty("jobRoles");
  });
});

test.describe("static assets", () => {
  test("favicon reachable", async ({ request }) => {
    const response = await request.get("/favicon.ico");
    expect(response.status()).toBe(200);
  });

  test("manifest reachable", async ({ request }) => {
    const response = await request.get("/site.webmanifest");
    expect(response.status()).toBe(200);
  });
});

test.describe("cors", () => {
  test("api accepts origin from this baseURL", async ({ request, baseURL }) => {
    const origin = new URL(baseURL ?? "https://staging.aply.global").origin;
    const response = await request.fetch(`${apiURL}/positions/meta`, {
      method: "GET",
      headers: { Origin: origin }
    });
    expect(response.status()).toBe(200);
    const allowOrigin = response.headers()["access-control-allow-origin"];
    expect(allowOrigin).toBe(origin);
  });
});
