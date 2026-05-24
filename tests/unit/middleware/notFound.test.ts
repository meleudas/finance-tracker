import type { Request, Response } from "express";
import { notFoundHandler } from "../../../src/middleware/notFound";

describe("notFoundHandler", () => {
  it("повертає 404 з requestId", () => {
    const req = {
      method: "GET",
      path: "/missing",
      id: "req-1",
    } as Request;
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res = { status } as unknown as Response;

    notFoundHandler(req, res, jest.fn());

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      error: {
        code: "NOT_FOUND",
        message: "Route GET /missing not found",
        requestId: "req-1",
      },
    });
  });
});
