import request from "supertest";
import { createApp } from "../../src/app";
import { CSRF_HEADER_NAME } from "../../src/middleware/csrfProtection";

describe("Public auth routes (full app)", () => {
  const app = createApp();

  it("GET /api/v1/auth/csrf не вимагає JWT", async () => {
    const res = await request(app).get("/api/v1/auth/csrf");
    expect(res.status).toBe(200);
    expect(res.body?.data?.csrfToken).toBeDefined();
  });

  it("GET /api/v1/currencies не вимагає JWT", async () => {
    const res = await request(app).get("/api/v1/currencies");
    expect(res.status).not.toBe(401);
  });

  it("POST /api/v1/auth/register не повертає 401 без JWT (лише CSRF)", async () => {
    const agent = request.agent(app);
    const csrfRes = await agent.get("/api/v1/auth/csrf");
    const csrfToken = csrfRes.body?.data?.csrfToken as string;

    const res = await agent
      .post("/api/v1/auth/register")
      .set(CSRF_HEADER_NAME, csrfToken)
      .send({
        email: `public-${String(Date.now())}@example.com`,
        password: "StrongPass123!",
      });

    expect(res.status).not.toBe(401);
  });

  it("POST /api/v1/auth/register з простроченим accessToken cookie не дає 401", async () => {
    const agent = request.agent(app);
    const csrfRes = await agent.get("/api/v1/auth/csrf");
    const csrfToken = csrfRes.body?.data?.csrfToken as string;

    const res = await agent
      .post("/api/v1/auth/register")
      .set(CSRF_HEADER_NAME, csrfToken)
      .set("Cookie", `accessToken=invalid.expired.token; csrfToken=${csrfToken}`)
      .send({
        email: `stale-cookie-${String(Date.now())}@example.com`,
        password: "StrongPass123!",
      });

    expect(res.status).not.toBe(401);
  });
});
