import request from "supertest";
import { createApp } from "../../src/app";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("GET /health", () => {
  it("returns 200 and status ok", async () => {
    const app = createApp();
    const res = await request(app).get("/health").expect(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("X-Request-Id", () => {
  it("додає X-Request-Id у відповідь", async () => {
    const app = createApp();
    const res = await request(app).get("/health").expect(200);
    expect(res.headers["x-request-id"]).toMatch(UUID_RE);
  });

  it("повторює валідний X-Request-Id від клієнта", async () => {
    const clientId = "550e8400-e29b-41d4-a716-446655440000";
    const app = createApp();
    const res = await request(app)
      .get("/api/v1/does-not-exist")
      .set("X-Request-Id", clientId)
      .expect(404);

    expect(res.headers["x-request-id"]).toBe(clientId);
    expect(res.body.error.requestId).toBe(clientId);
  });

  it("генерує новий id для невалідного X-Request-Id", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/api/v1/does-not-exist")
      .set("X-Request-Id", "invalid")
      .expect(404);

    expect(res.headers["x-request-id"]).toMatch(UUID_RE);
    expect(res.headers["x-request-id"]).not.toBe("invalid");
  });
});
