import { AuthService } from "../../../src/services/impl/AuthService";
import type { IUserRepository } from "../../../src/repositories/interfaces/IUserRepository";
import type { ITokenService } from "../../../src/services/interfaces/ITokenService";
import type { ICache } from "../../../src/redis";
import { ConflictError } from "../../../src/utils/errors/ClientErrors";
import { UnauthorizedError } from "../../../src/utils/errors/securityErrors";
import type { User } from "../../../src/generated/prisma/client";

jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashed_password"),
  compare: jest.fn(),
}));

import * as bcrypt from "bcrypt";

describe("AuthService - Unit Tests", () => {
  let authService: AuthService;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockTokenService: jest.Mocked<ITokenService>;
  let mockCache: jest.Mocked<ICache>;

  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const user: User = {
    id: userId,
    email: "user@example.com",
    passwordHash: "hashed_password",
    isDeleted: false,
    createdAt: new Date("2026-05-01T00:00:00.000Z"),
    updatedAt: new Date("2026-05-01T00:00:00.000Z"),
    deletedAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      findByEmail: jest.fn(),
      existsByEmail: jest.fn(),
      findByIdWithRelations: jest.fn(),
      findByEmailWithRelations: jest.fn(),
      findWithAccounts: jest.fn(),
      findWithTransactions: jest.fn(),
    } as unknown as jest.Mocked<IUserRepository>;

    mockTokenService = {
      generateAccessToken: jest.fn().mockReturnValue("access_token"),
      generateRefreshToken: jest.fn().mockReturnValue("refresh_token"),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
      decodeToken: jest.fn(),
    };

    mockCache = {
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      has: jest.fn().mockResolvedValue(false),
      delete: jest.fn(),
      ttl: jest.fn(),
      expire: jest.fn(),
      expireAt: jest.fn(),
      keys: jest.fn(),
      clear: jest.fn(),
      getJson: jest.fn(),
      setJson: jest.fn(),
    } as unknown as jest.Mocked<ICache>;

    authService = new AuthService(mockUserRepo, mockTokenService, mockCache);
  });

  describe("register", () => {
    it("має викинути ConflictError, якщо email вже зайнятий", async () => {
      mockUserRepo.findByEmail.mockResolvedValue(user);

      await expect(
        authService.register({
          email: "user@example.com",
          password: "StrongPass123!",
        }),
      ).rejects.toThrow(ConflictError);
    });

    it("має створити користувача та повернути токени", async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue(user);

      const result = await authService.register({
        email: "new@example.com",
        password: "StrongPass123!",
      });

      expect(result.accessToken).toBe("access_token");
      expect(result.refreshToken).toBe("refresh_token");
      expect(result.user.email).toBe(user.email);
    });
  });

  describe("login", () => {
    it("має викинути UnauthorizedError, якщо користувача не знайдено", async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);

      await expect(authService.login("missing@example.com", "pass")).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("має викинути UnauthorizedError при невірному паролі", async () => {
      mockUserRepo.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login("user@example.com", "wrong")).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("має повернути токени при валідних credentials", async () => {
      mockUserRepo.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login("user@example.com", "StrongPass123!");

      expect(result.accessToken).toBe("access_token");
      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith({
        userId,
        email: user.email,
      });
    });
  });

  describe("refreshToken", () => {
    it("не додає в blacklist, якщо exp відсутній", async () => {
      mockTokenService.verifyRefreshToken.mockReturnValue({
        userId,
        email: user.email,
        iat: 1,
      } as never);
      mockUserRepo.findById.mockResolvedValue(user);

      await authService.refreshToken("old_refresh");

      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it("має викинути UnauthorizedError, якщо користувача не знайдено", async () => {
      mockTokenService.verifyRefreshToken.mockReturnValue({
        userId,
        email: user.email,
        iat: 1,
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(authService.refreshToken("old_refresh")).rejects.toThrow(UnauthorizedError);
    });

    it("має ротувати токени та додати старий refresh у blacklist", async () => {
      mockTokenService.verifyRefreshToken.mockReturnValue({
        userId,
        email: user.email,
        iat: 1,
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      mockUserRepo.findById.mockResolvedValue(user);

      const result = await authService.refreshToken("old_refresh");

      expect(result.accessToken).toBe("access_token");
      expect(mockCache.set).toHaveBeenCalledWith("bl:old_refresh", "1", expect.any(Number));
    });
  });

  describe("verifyAccessToken", () => {
    it("повертає id та email з decoded token", async () => {
      mockTokenService.verifyAccessToken.mockReturnValue({
        userId,
        email: user.email,
        iat: 1,
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      const result = await authService.verifyAccessToken("access");

      expect(result).toEqual({ id: userId, email: user.email });
    });
  });

  describe("logout", () => {
    it("blacklist access token з дійсним exp", async () => {
      mockTokenService.decodeToken.mockReturnValue({
        userId,
        email: user.email,
        iat: 1,
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      await authService.logout("access_token");

      expect(mockCache.set).toHaveBeenCalledWith("bl:access_token", "1", expect.any(Number));
    });

    it("ігнорує помилки decode access token", async () => {
      mockTokenService.decodeToken.mockImplementation(() => {
        throw new Error("invalid");
      });

      await expect(authService.logout("bad_access")).resolves.toBeUndefined();
    });

    it("blacklist refresh token з дійсним exp", async () => {
      mockTokenService.verifyRefreshToken.mockReturnValue({
        userId,
        email: user.email,
        iat: 1,
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      await authService.logout(undefined, "refresh_token");

      expect(mockCache.set).toHaveBeenCalledWith("bl:refresh_token", "1", expect.any(Number));
    });

    it("ігнорує помилки verify refresh token", async () => {
      mockTokenService.verifyRefreshToken.mockImplementation(() => {
        throw new Error("invalid");
      });

      await expect(authService.logout(undefined, "bad_refresh")).resolves.toBeUndefined();
    });

    it("не blacklist при exp <= 0", async () => {
      mockTokenService.decodeToken.mockReturnValue({
        userId,
        email: user.email,
        iat: 1,
        exp: Math.floor(Date.now() / 1000) - 10,
      });

      await authService.logout("expired_access");

      expect(mockCache.set).not.toHaveBeenCalled();
    });
  });

  describe("isTokenBlacklisted", () => {
    it("делегує перевірку в cache.has", async () => {
      mockCache.has.mockResolvedValue(true);

      const result = await authService.isTokenBlacklisted("token");

      expect(result).toBe(true);
      expect(mockCache.has).toHaveBeenCalledWith("bl:token");
    });
  });
});
