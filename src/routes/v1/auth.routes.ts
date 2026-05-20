import { Router } from "express";
import { createAuthMiddleware } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/asyncHandler";
import { strictLimiter } from "../../middleware/rateLimit";
import { csrfProtection } from "../../middleware/csrfProtection";
import {
  LoginRequestValidator,
  RefreshTokenRequestValidator,
  RegisterRequestValidator,
} from "../../validators/auth.validator";
import type { AuthController } from "../../controllers/AuthController";
import type { IAuthService } from "../../services/interfaces/IAuthService";

export function createAuthRouter(deps: {
  authService: IAuthService;
  authController: AuthController;
}): Router {
  const router = Router();
  const { authService, authController } = deps;

  router.get("/csrf", asyncHandler(authController.csrfHandler));

  router.post(
    "/register",
    strictLimiter,
    csrfProtection,
    RegisterRequestValidator,
    asyncHandler(authController.registerHandler),
  );

  router.post(
    "/login",
    strictLimiter,
    csrfProtection,
    LoginRequestValidator,
    asyncHandler(authController.loginHandler),
  );

  router.post(
    "/refresh",
    csrfProtection,
    RefreshTokenRequestValidator,
    asyncHandler(authController.refreshHandler),
  );

  router.post(
    "/logout",
    csrfProtection,
    createAuthMiddleware(authService),
    asyncHandler(authController.logoutHandler),
  );

  return router;
}

export default createAuthRouter;
