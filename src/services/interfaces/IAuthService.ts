import { ServiceContext } from "../serviceContext";
import { AuthResponse } from "../../dtos/auth/AuthResponse.dto";
import { RefreshResponse } from "../../dtos/auth/RefreshResponse.dto";
import { RegisterSchema } from "../../validators/registerSchema";

export interface IAuthService {
  register(userData: RegisterSchema, ctx?: ServiceContext): Promise<AuthResponse>;
  login(email: string, password: string, ctx?: ServiceContext): Promise<AuthResponse>;
  refreshToken(token: string, ctx?: ServiceContext): Promise<RefreshResponse>;
  verifyAccessToken(token: string, ctx?: ServiceContext): Promise<{ id: string; email: string }>;
  logout(accessToken?: string, refreshToken?: string, ctx?: ServiceContext): Promise<void>;
  isTokenBlacklisted(token: string, ctx?: ServiceContext): Promise<boolean>;
}
