import { RegisterSchema } from "../../../validators/auth/registerSchema";
import { AuthResponse } from "../../../dtos/auth/AuthResponseSchema";
import { RefreshResponse } from "../../../dtos/auth/RefreshResponseSchema";
import { LoginResponse } from "../../../dtos/auth/LoginResponseSchema";
import { ServiceContext } from "../../serviceContext";
import { DecodedToken } from "../../../types/auth/DecodedToken";

export interface IAuthService {
  register(userData: RegisterSchema, ctx?: ServiceContext): Promise<AuthResponse>;
  login(email: string, password: string, ctx?: ServiceContext): Promise<LoginResponse>;
  refreshToken(token: string, ctx?: ServiceContext): Promise<RefreshResponse>;
  verifyAccessToken(token: string, ctx?: ServiceContext): Promise<DecodedToken>;
  logout(accessToken?: string, refreshToken?: string, ctx?: ServiceContext): Promise<void>;
  isTokenBlacklisted(token: string, ctx?: ServiceContext): Promise<boolean>;
}
