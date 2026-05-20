import request from "supertest";
import { createApp } from "../../src/app";

describe("OpenAPI / Swagger", () => {
  const app = createApp();

  it("GET /api/openapi.json returns OpenAPI 3 document", async () => {
    const response = await request(app).get("/api/openapi.json");

    expect(response.status).toBe(200);
    const body = response.body as {
      openapi: string;
      info: { title: string };
      paths: Record<string, unknown>;
      components: { securitySchemes: Record<string, unknown> };
    };
    expect(body.openapi).toMatch(/^3\.0\./);
    expect(body.info.title).toBe("Finance Tracker API");
    expect(body.paths["/api/v1/transactions"]).toBeDefined();
    expect(body.paths["/health"]).toBeDefined();
    expect(body.components.securitySchemes.cookieAuth).toBeDefined();
    expect(body.components.securitySchemes.devUserId).toBeDefined();
  });

  it("GET /api/docs serves Swagger UI", async () => {
    const response = await request(app).get("/api/docs/");

    expect(response.status).toBe(200);
    expect(response.text).toContain("swagger-ui");
  });
});
