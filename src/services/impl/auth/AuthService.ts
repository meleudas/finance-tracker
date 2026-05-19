import { User } from "../../../generated/prisma/client";
import { TokenPayload } from "../../../types/auth/TokenPayload";
import { TokenPair } from "../../../types/auth/TokenPair";
import { AuthResponse } from "../../../dtos/auth/AuthResponseSchema";
import { RegisterSchema } from "../../../validators/auth/registerSchema";
import { UserResponse } from "../../../dtos/users/userResponseSchema";
import { ITokenService } from "../../interfaces/auth/ITokenService";
import { IAuthService } from "../../interfaces/auth/IAuthService";
import { IUserRepository } from "../../../repositories/interfaces/IUserRepository";
import { ICache } from "../../../redis";
import * as bcrypt from "bcrypt";
import { LoginResponse } from "../../../dtos/auth/LoginResponseSchema";
import { RefreshResponse } from "../../../dtos/auth/RefreshResponseSchema";
import { saltRounds } from "../../../utils/constants/auth/saltRounds";
import { ConflictError } from "../../../utils/errors/ClientErrors";
import { UnauthorizedError } from "../../../utils/errors/SecurityErrors";
import { repoOptions, ServiceContext } from "../../serviceContext";

export class AuthService implements IAuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly cache: ICache,
  ) {}

  async register(userData: RegisterSchema, ctx?: ServiceContext): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findByEmail(userData.email, repoOptions(ctx));
    if (existingUser) {
      throw new ConflictError();
    }

    const hashedPassword = await this._hashPassword(userData.password);

    const user = await this.userRepository.create({
      email: userData.email,
      passwordHash: hashedPassword,
    }, repoOptions(ctx));

    const tokens = await this._generateTokens({
      userId: user.id,
      email: user.email,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: await this._sanitizeUserOutput(user),
    };
  }

  async login(email: string, password: string, ctx?: ServiceContext): Promise<LoginResponse> {
    const user = await this.userRepository.findByEmail(email, repoOptions(ctx));
    if (!user) {
      throw new UnauthorizedError();
    }

    const isValidPassword = await this._comparePasswords(password, user.passwordHash);

    if (!isValidPassword) {
      throw new UnauthorizedError();
    }

    const tokens = await this._generateTokens({
      userId: user.id,
      email: user.email,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: await this._sanitizeUserOutput(user),
    };
  }

  async refreshToken(token: string, ctx?: ServiceContext): Promise<RefreshResponse> {
    const decodedToken = this.tokenService.verifyRefreshToken(token);

    const user = await this.userRepository.findById(decodedToken.userId, repoOptions(ctx));
    if (!user) {
      throw new UnauthorizedError();
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

  async validateAccessToken(token: string, _ctx?: ServiceContext): Promise<boolean> {
    try {
      this.tokenService.verifyAccessToken(token);
      return true;
    } catch {
      return Promise.resolve(false);
    }
  }

  async logout(accessToken?: string, refreshToken?: string, _ctx?: ServiceContext): Promise<void> {
    if (accessToken) {
      try {
        const decoded = this.tokenService.decodeToken(accessToken);
        if (decoded.exp) {
          const ttlSeconds = decoded.exp - Math.floor(Date.now() / 1000);
          if (ttlSeconds > 0) {
            await this.cache.set(`bl:${accessToken}`, "1", ttlSeconds);
          }
        }
      } catch (error) {
        void error;
      }
    }

    if (refreshToken) {
      try {
        const decoded = this.tokenService.verifyRefreshToken(refreshToken);
        if (decoded.exp) {
          const ttlSeconds = decoded.exp - Math.floor(Date.now() / 1000);
          if (ttlSeconds > 0) {
            await this.cache.set(`bl:${refreshToken}`, "1", ttlSeconds);
          }
        }
      } catch (error) {
        void error;
      }
    }
  }

  async isTokenBlacklisted(token: string, _ctx?: ServiceContext): Promise<boolean> {
    return await this.cache.has(`bl:${token}`);
  }

  private async _hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, saltRounds);
  }

  private async _comparePasswords(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  private async _generateTokens(payload: TokenPayload): Promise<TokenPair> {
    return Promise.resolve({
      accessToken: this.tokenService.generateAccessToken(payload),
      refreshToken: this.tokenService.generateRefreshToken(payload),
    });
  }

  private async _sanitizeUserOutput(user: User): Promise<UserResponse> {
    return Promise.resolve({
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}
