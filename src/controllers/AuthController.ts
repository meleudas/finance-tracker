import type { CookieOptions, Request, Response } from "express";
import type { IAuthService } from "../services/interfaces/IAuthService";
import type { ConfigService } from "../config/ConfigService";
import type { LoginSchema } from "../validators/loginSchema";
import type { RegisterSchema } from "../validators/registerSchema";
import { getServiceContext } from "../http/requestContext";
import { UnauthorizedError } from "../utils/errors/securityErrors";
import { jwtTtlToMs } from "../utils/jwtTtl";
import { getAuthCookieOptions } from "../config/authCookieOptions";
import { issueCsrfToken } from "../middleware/csrfProtection";

export class AuthController {
  constructor(
    private readonly authService: IAuthService,
    private readonly config: ConfigService,
  ) {}

  private get cookieOptions(): Pick<CookieOptions, "secure" | "sameSite" | "path"> {
    return getAuthCookieOptions(this.config);
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    res.cookie("accessToken", accessToken, {
      ...this.cookieOptions,
      httpOnly: true,
      maxAge: jwtTtlToMs(this.config.jwtAccessTTL),
    });

    res.cookie("refreshToken", refreshToken, {
      ...this.cookieOptions,
      httpOnly: true,
      maxAge: jwtTtlToMs(this.config.jwtRefreshTTL),
    });
  }

  csrfHandler = (_req: Request, res: Response): void => {
    const csrfToken = issueCsrfToken(res, getAuthCookieOptions(this.config));
    res.status(200).json({
      success: true,
      data: { csrfToken },
    });
  };

  registerHandler = async (req: Request, res: Response): Promise<void> => {
    const { body } = req.validated as { body: RegisterSchema };

    const { user, accessToken, refreshToken } = await this.authService.register(
      body,
      getServiceContext(req),
    );

    this.setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json({
      success: true,
      data: { user, accessToken, refreshToken },
    });
  };

  loginHandler = async (req: Request, res: Response): Promise<void> => {
    const { body } = req.validated as { body: LoginSchema };

    const { user, accessToken, refreshToken } = await this.authService.login(
      body.email,
      body.password,
      getServiceContext(req),
    );

    this.setAuthCookies(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      data: { user, accessToken, refreshToken },
    });
  };

  refreshHandler = async (req: Request, res: Response): Promise<void> => {
    const cookies = (req.cookies as Record<string, unknown> | undefined) ?? {};
    const { body } = req.validated as { body: { refreshToken?: string } };

    const tokenRaw = cookies.refreshToken ?? body.refreshToken;

    if (!tokenRaw || typeof tokenRaw !== "string") {
      throw new UnauthorizedError();
    }

    const isBlacklisted = await this.authService.isTokenBlacklisted(
      tokenRaw,
      getServiceContext(req),
    );
    if (isBlacklisted) {
      throw new UnauthorizedError();
    }

    const { accessToken, refreshToken: newRefreshToken } = await this.authService.refreshToken(
      tokenRaw,
      getServiceContext(req),
    );

    this.setAuthCookies(res, accessToken, newRefreshToken);

    res.status(200).json({
      success: true,
      data: { accessToken, refreshToken: newRefreshToken },
    });
  };

  logoutHandler = async (req: Request, res: Response): Promise<void> => {
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
      ...this.cookieOptions,
      httpOnly: true,
    });

    res.clearCookie("refreshToken", {
      ...this.cookieOptions,
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
    });
  };
}
