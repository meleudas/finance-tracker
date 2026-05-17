import { Request, Response, NextFunction } from "express";
import { AuthService } from "../../services/impl/auth/AuthService";
import { loginSchema } from "../../validators/auth/loginSchema";
import { registerSchema } from "../../validators/auth/registerSchema";
import { userResponseSchema } from "../../dtos/users/userResponseSchema";
import { ConfigService } from "../../config/ConfigService";
import { AppError } from "../../utils/errors/appError";

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  async registerHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedBody = await registerSchema.parseAsync(req.body);

      const { user, accessToken, refreshToken } = await this.authService.register(validatedBody);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: this.config.isProduction,
        sameSite: this.config.isProduction ? "none" : "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        user,
        accessToken,
      });
    } catch (err) {
      next(err);
    }
  }

  async loginHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedBody = await loginSchema.parseAsync(req.body);
      const { user, accessToken, refreshToken } = await this.authService.login(
        validatedBody.email,
        validatedBody.password,
      );

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: this.config.isProduction,
        sameSite: this.config.isProduction ? "none" : "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const safeUser = userResponseSchema.parse({
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });

      res.status(200).json({
        success: true,
        data: {
          user: safeUser,
          accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshHandler(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.cookies.refreshToken || typeof req.cookies.refreshToken !== "string") {
        next(new AppError("REFRESH_TOKEN_IS_REQUIRED", "Refresh token is required", 401));
        return;
      }

      const refreshToken = req.cookies.refreshToken;

      const { accessToken, refreshToken: newRefreshToken } =
        await this.authService.refreshToken(refreshToken);

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: this.config.isProduction,
        sameSite: this.config.isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        data: { accessToken },
      });
    } catch (error) {
      next(error);
    }
  }
}
