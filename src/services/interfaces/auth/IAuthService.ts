import { RegisterSchema } from "../../../validators/auth/registerSchema";
import { AuthResponse } from "../../../dtos/auth/AuthResponseSchema";
import { RefreshResponse } from "../../../dtos/auth/RefreshResponseSchema";
import { LoginResponse } from "../../../dtos/auth/LoginResponseSchema";

export interface IAuthService {
  register(userData: RegisterSchema): Promise<AuthResponse>;
  login(email: string, password: string): Promise<LoginResponse>;
  refreshToken(token: string): Promise<RefreshResponse>;
  validateAccessToken(token: string): Promise<boolean>;
}
