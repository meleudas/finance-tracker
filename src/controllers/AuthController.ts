import { Request, Response } from "express";
import { IAuthService } from "../services/interfaces/auth/IAuthService";
import { ConfigService } from "../config/ConfigService";
import { RegisterSchema } from "../validators/auth/registerSchema";
import { getServiceContext } from "../http/requestContext";
import { asyncHandler } from "../middleware/asyncHandler";
import { unauthorizedError } from "../utils/apiError";

export class AuthController {
  constructor(
    private readonly authService: IAuthService,
    private readonly config: ConfigService,
  ) {}

  registerHandler = asyncHandler(async (req: Request, res: Response) => {
    const validated = req.validated as unknown as { body: RegisterSchema };
    const { body } = validated;

    const { user, accessToken, refreshToken } = await this.authService.register(
      body,
      getServiceContext(req)
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: this.config.isProduction ? "none" : "lax",
      path: "/",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: this.config.isProduction ? "none" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      data: { user, accessToken, refreshToken },
    });
  });

  loginHandler = asyncHandler(async (req: Request, res: Response) => {
    const validated = req.validated as unknown as { body: { email: string; password: string } };
    const { body } = validated;

    const { user, accessToken, refreshToken } = await this.authService.login(
      body.email,
      body.password,
      getServiceContext(req)
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: this.config.isProduction ? "none" : "lax",
      path: "/",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: this.config.isProduction ? "none" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      data: { user, accessToken, refreshToken },
    });
  });

  refreshHandler = asyncHandler(async (req: Request, res: Response) => {
    const cookies = (req.cookies as Record<string, unknown> | undefined) ?? {};
    const body = (req.body as Record<string, unknown> | undefined) ?? {};

    const token = (cookies.refreshToken as string | undefined) ?? (body.refreshToken as string | undefined);

    if (!token || typeof token !== "string") {
      throw unauthorizedError();
    }

    const isBlacklisted = await this.authService.isTokenBlacklisted(token, getServiceContext(req));
    if (isBlacklisted) {
      throw unauthorizedError();
    }

    const { accessToken, refreshToken: newRefreshToken } = await this.authService.refreshToken(
      token,
      getServiceContext(req)
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: this.config.isProduction ? "none" : "lax",
      path: "/",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: this.config.isProduction ? "none" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      data: { accessToken, refreshToken: newRefreshToken },
    });
  });

  logoutHandler = asyncHandler(async (req: Request, res: Response) => {
    let accessToken: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      accessToken = authHeader.substring(7);
    }

    const cookies = (req.cookies as Record<string, unknown> | undefined) ?? {};
    accessToken ??= cookies.accessToken as string | undefined;
    const refreshToken = cookies.refreshToken as string | undefined;

    await this.authService.logout(accessToken, refreshToken, getServiceContext(req));

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: this.config.isProduction ? "none" : "lax",
      path: "/",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: this.config.isProduction ? "none" : "lax",
      path: "/",
    });

    res.status(200).json({
      success: true,
    });
  });
}
