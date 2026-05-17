import { NextFunction } from "express";

export interface IAuthController {
  registerHandler: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  loginHandler: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  refreshHandler: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
