import type { Request } from "express";
import type { ServiceContext } from "../services/serviceContext";

export function getServiceContext(req: Request): ServiceContext {
  return { signal: req.abortSignal };
}
