import { Request, Response } from "express";
import { ConfigService } from "../config/ConfigService";
import { getServiceContext } from "../http/requestContext";
import { asyncHandler } from "../middleware/asyncHandler";
import { unauthorizedError } from "../utils/apiError";
import { IAuthService } from "../services/interfaces/IAuthService";
import { AuthResponse } from "../dtos/auth/AuthResponse.dto";
import { RefreshResponse } from "../dtos/auth/RefreshResponse.dto";
import { RegisterSchema } from "../validators/registerSchema";
import { LoginSchema } from "../validators/loginSchema";

interface AuthCookies {
  accessToken?: string;
  refreshToken?: string;
}

export class AuthController {
  constructor(
    private readonly authService: IAuthService,
    private readonly config: ConfigService,
  ) {}

  registerHandler = asyncHandler(async (req: Request, res: Response) => {
    const body = req.validated?.body as RegisterSchema;

    const result: AuthResponse = await this.authService.register(body, getServiceContext(req));

    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(201).json({
      success: true,
      data: {
        user: { id: result.user.id, email: result.user.email },
      },
    });
  });

  loginHandler = asyncHandler(async (req: Request, res: Response) => {
    const body = req.validated?.body as LoginSchema;

    const result: AuthResponse = await this.authService.login(
      body.email,
      body.password,
      getServiceContext(req),
    );

    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json({
      success: true,
      data: {
        user: { id: result.user.id, email: result.user.email },
      },
    });
  });

  refreshHandler = asyncHandler(async (req: Request, res: Response) => {
    const cookies = req.cookies as AuthCookies;
    const token = cookies.refreshToken;

    if (!token) {
      throw unauthorizedError();
    }

    const isBlacklisted = await this.authService.isTokenBlacklisted(token, getServiceContext(req));
    if (isBlacklisted) {
      throw unauthorizedError();
    }

    const result: RefreshResponse = await this.authService.refreshToken(
      token,
      getServiceContext(req),
    );

    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json({
      success: true,
      data: { message: "Token refreshed successfully" },
    });
  });

  logoutHandler = asyncHandler(async (req: Request, res: Response) => {
    const cookies = req.cookies as AuthCookies;

    let accessToken: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      accessToken = authHeader.substring(7);
    }
    accessToken ??= cookies.accessToken;

    const refreshToken = cookies.refreshToken;

    await this.authService.logout(accessToken, refreshToken, getServiceContext(req));

    this.clearAuthCookies(res);

    res.status(200).json({ success: true, message: "Logged out successfully" });
  });

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const options = {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: this.config.isProduction ? ("none" as const) : ("lax" as const),
      path: "/",
    } as const;

    res.cookie("accessToken", accessToken, { ...options, maxAge: 15 * 60 * 1000 });
    res.cookie("refreshToken", refreshToken, { ...options, maxAge: 7 * 24 * 60 * 60 * 1000 });
  }

  private clearAuthCookies(res: Response) {
    const options = {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: this.config.isProduction ? ("none" as const) : ("lax" as const),
      path: "/",
    } as const;

    res.clearCookie("accessToken", options);
    res.clearCookie("refreshToken", options);
  }
}
