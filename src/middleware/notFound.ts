import type { RequestHandler } from "express";
import { requestIdFrom } from "../utils/requestId";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
      requestId: requestIdFrom(req),
    },
  });
};
