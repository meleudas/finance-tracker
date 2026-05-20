import { IAuthService } from "../interfaces/IAuthService";
import { IUserRepository } from "../../repositories/interfaces/IUserRepository";
import { ITokenService } from "../interfaces/ITokenService";
import { ICache } from "../../redis";
import { repoOptions, ServiceContext, withServiceSignal } from "../serviceContext";
import { AuthResponse } from "../../dtos/auth/AuthResponse.dto";
import { ConflictError } from "../../utils/errors/ClientErrors";
import { UnauthorizedError } from "../../utils/errors/securityErrors";
import { RefreshResponse } from "../../dtos/auth/RefreshResponse.dto";
import { saltRounds } from "../../utils/constants/auth/saltRounds";
import { TokenPayload } from "../../types/auth/TokenPayload";
import { TokenPair } from "../../types/auth/TokenPair";
import { toUserResponse } from "../../mappers/user.mapper";
import * as bcrypt from "bcrypt";
import { RegisterSchema } from "../../validators/registerSchema";

interface JwtPayloadWithExp {
  userId: string;
  email: string;
  exp?: number;
}

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

    const user = await this.userRepository.create(
      {
        email: userData.email,
        passwordHash: hashedPassword,
      },
      repoOptions(ctx),
    );

    const tokens = await this._generateTokens({
      userId: user.id,
      email: user.email,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: toUserResponse(user),
    };
  }

  async login(email: string, password: string, ctx?: ServiceContext): Promise<AuthResponse> {
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
      user: toUserResponse(user),
    };
  }

  async refreshToken(token: string, ctx?: ServiceContext): Promise<RefreshResponse> {
    const decodedToken = this.tokenService.verifyRefreshToken(token);

    const user = await this.userRepository.findById(decodedToken.userId, repoOptions(ctx));
    if (!user) {
      throw new UnauthorizedError();
    }

    if (decodedToken.exp) {
      const ttlSeconds = decodedToken.exp - Math.floor(Date.now() / 1000);
      if (ttlSeconds > 0) {
        await this.cache.set(`bl:${token}`, "1", ttlSeconds);
      }
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

  async verifyAccessToken(
    token: string,
    _ctx?: ServiceContext,
  ): Promise<{ id: string; email: string }> {
    const decoded = this.tokenService.verifyAccessToken(token) as JwtPayloadWithExp;
    return Promise.resolve({
      id: decoded.userId,
      email: decoded.email,
    });
  }

  async logout(accessToken?: string, refreshToken?: string, ctx?: ServiceContext): Promise<void> {
    if (accessToken) {
      try {
        const decoded = this.tokenService.decodeToken(accessToken);
        if (decoded.exp) {
          const ttlSeconds = decoded.exp - Math.floor(Date.now() / 1000);
          if (ttlSeconds > 0) {
            await withServiceSignal(this.cache.set(`bl:${accessToken}`, "1", ttlSeconds), ctx);
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
            await withServiceSignal(this.cache.set(`bl:${refreshToken}`, "1", ttlSeconds), ctx);
          }
        }
      } catch (error) {
        void error;
      }
    }
  }

  async isTokenBlacklisted(token: string, ctx?: ServiceContext): Promise<boolean> {
    return withServiceSignal(this.cache.has(`bl:${token}`), ctx);
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
}
