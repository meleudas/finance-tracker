declare global {
  namespace Express {
    interface Request {
      /** Set by pino-http via genReqId */
      id: string;

      user?: {
        id: string,
        email: string
    }
    }
  }
}

export {};
