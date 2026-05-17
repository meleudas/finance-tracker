import type { Response } from "express";
import type { Request } from "express";
import type { PaginatedResult } from "../repositories/interfaces/IBaseRepository";

type JsonMeta = Record<string, unknown>;

function buildMeta(req: Request, extra?: JsonMeta): JsonMeta {
  return {
    requestId: req.id,
    ...extra,
  };
}

export function sendData(
  res: Response,
  req: Request,
  data: unknown,
  statusCode = 200,
  meta?: JsonMeta,
): void {
  res.status(statusCode).json({
    data,
    meta: buildMeta(req, meta),
  });
}

export function sendPaginated<T>(
  res: Response,
  req: Request,
  result: PaginatedResult<T>,
  statusCode = 200,
): void {
  const { data, page, limit, total, totalPages } = result;
  sendData(res, req, data, statusCode, { page, limit, total, totalPages });
}
