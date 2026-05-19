import { RegisterSchema } from "../../../validators/auth/registerSchema";
import { AuthResponse } from "../../../dtos/auth/AuthResponseSchema";
import { RefreshResponse } from "../../../dtos/auth/RefreshResponseSchema";
import { LoginResponse } from "../../../dtos/auth/LoginResponseSchema";
import { ServiceContext } from "../../ServiceContext";

export interface IAuthService {
  register(userData: RegisterSchema, ctx?: ServiceContext): Promise<AuthResponse>;
  login(email: string, password: string, ctx?: ServiceContext): Promise<LoginResponse>;
  refreshToken(token: string, ctx?: ServiceContext): Promise<RefreshResponse>;
  validateAccessToken(token: string, ctx?: ServiceContext): Promise<boolean>;
  logout(accessToken?: string, refreshToken?: string, ctx?: ServiceContext): Promise<void>;
  isTokenBlacklisted(token: string, ctx?: ServiceContext): Promise<boolean>;
}
