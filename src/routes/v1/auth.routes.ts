import { Router } from "express";
import { UserRepository } from "../../repositories/impl/UserRepository";
import { validate } from "../../middleware/validate";
import { config } from "../../config/ConfigService";
import { AuthController } from "../../controllers/AuthController";
import { createAuthMiddleware } from "../../middleware/auth";
import { Cache } from "../../redis";
import { asyncHandler } from "../../middleware/asyncHandler";
import { TokenService } from "../../services/impl/TokenService";
import { AuthService } from "../../services/impl/AuthService";
import { registerSchema } from "../../validators/registerSchema";
import { loginSchema } from "../../validators/loginSchema";

const userRepository = new UserRepository();
const tokenService = new TokenService(config);
const cache = new Cache();

const authService = new AuthService(userRepository, tokenService, cache);
const authController = new AuthController(authService, config);

const router = Router();

router.post("/register", validate(registerSchema), asyncHandler(authController.registerHandler));

router.post("/login", validate(loginSchema), asyncHandler(authController.loginHandler));

router.post("/refresh", asyncHandler(authController.refreshHandler));

router.post(
  "/logout",
  createAuthMiddleware(authService),
  asyncHandler(authController.logoutHandler),
);

export default router;
