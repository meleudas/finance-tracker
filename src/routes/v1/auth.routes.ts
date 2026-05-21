import { Router } from "express";
import { createAuthMiddleware } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/asyncHandler";
import { strictLimiter } from "../../middleware/rateLimit";
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
    RegisterRequestValidator,
    asyncHandler(authController.registerHandler),
  );

  router.post(
    "/login",
    strictLimiter,
    LoginRequestValidator,
    asyncHandler(authController.loginHandler),
  );

  router.post(
    "/refresh",
    RefreshTokenRequestValidator,
    asyncHandler(authController.refreshHandler),
  );

  router.post(
    "/logout",
    createAuthMiddleware(authService),
    asyncHandler(authController.logoutHandler),
  );

  return router;
}

export default createAuthRouter;
