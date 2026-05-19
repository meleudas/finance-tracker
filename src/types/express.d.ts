declare global {
  namespace Express {
    interface Request {
      /** Set by pino-http via genReqId */
      id: string;
      /** Set by attachAbortSignal middleware */
      abortController: AbortController;
      abortSignal: AbortSignal;
      /** Set by auth middleware (or dev stub). */
      user?: {
        id: string;
        email: string;
      };
      /** Output of validate() middleware. */
      validated?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }
  }
}

export {};
