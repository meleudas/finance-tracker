import { User } from "../../../generated/prisma/client";
import { TokenPayload } from "../../../types/auth/TokenPayload";
import { TokenPair } from "../../../types/auth/TokenPair";
import { AuthResponse } from "../../../dtos/auth/AuthResponseSchema";
import { RegisterSchema } from "../../../validators/auth/registerSchema";
import { UserResponse } from "../../../dtos/users/userResponseSchema";
import { ITokenService } from "../../interfaces/auth/ITokenService";
import { IAuthService } from "../../interfaces/auth/IAuthService";
import { IUserRepository } from "../../../repositories/interfaces/IUserRepository";
import * as bcrypt from "bcrypt";
import { AppError } from "../../../utils/errors/appError";
import { LoginResponse } from "../../../dtos/auth/LoginResponseSchema";
import { RefreshResponse } from "../../../dtos/auth/RefreshResponseSchema";
import { saltRounds } from "../../../utils/constants/auth/saltRounds";

export class AuthService implements IAuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService,
  ) {}

  async register(userData: RegisterSchema): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError("USER_ALREADY_EXISTS", "User with this email already exists", 409);
    }

    const hashedPassword = await this._hashPassword(userData.password);

    const user = await this.userRepository.create({
      email: userData.email,
      passwordHash: hashedPassword,
    });

    const tokens = await this._generateTokens({
      userId: user.id,
      email: user.email,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this._sanitizeUserOutput(user),
    };
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("INVALID_CREDENTIALS", "Invalid email or password", 401);
    }

    const isValidPassword = await this._comparePasswords(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError("INVALID_CREDENTIALS", "Invalid email or password", 401);
    }

    const tokens = await this._generateTokens({
      userId: user.id,
      email: user.email,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this._sanitizeUserOutput(user),
    };
  }

  async refreshToken(token: string): Promise<RefreshResponse> {
    const decodedToken = this.tokenService.verifyRefreshToken(token);

    const user = await this.userRepository.findById(decodedToken.userId);
    if (!user) {
      throw new AppError("INVALID_REFRESH_TOKEN", "Invalid token", 401);
    }

    const tokens = await this._generateTokens({
      userId: user.id,
      email: user.email,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  validateAccessToken(token: string): Promise<boolean> {
    try {
      this.tokenService.verifyAccessToken(token);
      return Promise.resolve(true);
    } catch {
      return Promise.resolve(false);
    }
  }

  private async _hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, saltRounds);
  }

  private async _comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private async _generateTokens(payload: TokenPayload): Promise<TokenPair> {
    return Promise.resolve({
      accessToken: this.tokenService.generateAccessToken(payload),
      refreshToken: this.tokenService.generateRefreshToken(payload),
    });
  }

  private _sanitizeUserOutput(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
