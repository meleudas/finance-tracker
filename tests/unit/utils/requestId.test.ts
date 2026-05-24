import { isValidRequestId, requestIdFrom, resolveRequestId } from "../../../src/utils/requestId";
import type { IncomingMessage, ServerResponse } from "node:http";

describe("requestId utils", () => {
  describe("isValidRequestId", () => {
    it("приймає валідний UUID", () => {
      expect(isValidRequestId("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    });

    it("відхиляє невалідні значення", () => {
      expect(isValidRequestId("not-a-uuid")).toBe(false);
      expect(isValidRequestId("")).toBe(false);
    });
  });

  describe("requestIdFrom", () => {
    it("повертає req.id якщо є", () => {
      expect(requestIdFrom({ id: "abc" })).toBe("abc");
    });

    it("повертає unknown якщо id відсутній", () => {
      expect(requestIdFrom({})).toBe("unknown");
    });
  });

  describe("resolveRequestId", () => {
    function mockRes() {
      const headers: Record<string, string> = {};
      return {
        setHeader: (name: string, value: string) => {
          headers[name] = value;
        },
        headers,
      } as unknown as ServerResponse & { headers: Record<string, string> };
    }

    it("використовує валідний X-Request-Id від клієнта", () => {
      const clientId = "550e8400-e29b-41d4-a716-446655440000";
      const req = { headers: { "x-request-id": clientId } } as unknown as IncomingMessage;
      const res = mockRes();

      expect(resolveRequestId(req, res)).toBe(clientId);
      expect(res.headers["X-Request-Id"]).toBe(clientId);
    });

    it("генерує новий id для невалідного заголовка", () => {
      const req = { headers: { "x-request-id": "bad-id" } } as unknown as IncomingMessage;
      const res = mockRes();

      const id = resolveRequestId(req, res);
      expect(isValidRequestId(id)).toBe(true);
      expect(id).not.toBe("bad-id");
    });
  });
});
