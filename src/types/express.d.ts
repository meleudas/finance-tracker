import type { Logger } from "pino";
import type { RegisterSchema } from "../validators/registerSchema";
import type { LoginSchema } from "../validators/loginSchema";

declare global {
  namespace Express {
    interface Request {
      /** Set by pino-http via genReqId */
      id?: string;

      /** Request-scoped logger from pino-http */
      log?: Logger;

      /** Set by attachAbortSignal middleware */
      abortController?: AbortController;
      abortSignal?: AbortSignal;

      /** Set by auth middleware */
      user?: {
        id: string;
        email: string;
      };

      /** Output of createRequestValidator middleware */
      validated?: {
        body?: RegisterSchema | LoginSchema | Record<string, unknown>;
        query?: Record<string, unknown>;
        params?: Record<string, unknown>;
      };
    }
  }
}

export {};
