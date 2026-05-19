import { Router } from "express";
import { UserRepository } from "../../repositories/impl/UserRepository";
import { TokenService } from "../../services/impl/auth/TokenService";
import { AuthService } from "../../services/impl/auth/AuthService";
import { validate } from "../../middleware/validate";
import { loginSchema } from "../../validators/auth/loginSchema";
import { registerSchema } from "../../validators/auth/registerSchema";
import { config } from "../../config/ConfigService";
import { AuthController } from "../../controllers/AuthController";
import { createAuthMiddleware } from "../../middleware/auth";
import { Cache } from "../../redis";
import { asyncHandler } from "../../middleware/asyncHandler";

const userRepository = new UserRepository();
const tokenService = new TokenService(config);
const cache = new Cache();

const authService = new AuthService(userRepository, tokenService, cache);
const authController = new AuthController(authService, config);

const router = Router();

router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(authController.registerHandler),
);

router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(authController.loginHandler),
);

router.post(
  "/refresh",
  asyncHandler(authController.refreshHandler),
);

router.post(
  "/logout",
  createAuthMiddleware,
  asyncHandler(authController.logoutHandler),
);

export default router;
