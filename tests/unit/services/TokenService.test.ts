import { TokenService } from "../../../src/services/impl/TokenService";
import { ConfigService } from "../../../src/config/ConfigService";
import { env } from "../../../src/config/env";

describe("TokenService", () => {
  let tokenService: TokenService;
  const payload = { userId: "clg7v9x1k0000qzq8x8x8x8x8", email: "user@example.com" };

  beforeEach(() => {
    tokenService = new TokenService(new ConfigService(env));
  });

  it("generateAccessToken and verifyAccessToken round-trip", () => {
    const token = tokenService.generateAccessToken(payload);
    const decoded = tokenService.verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
  });

  it("generateRefreshToken and verifyRefreshToken round-trip", () => {
    const token = tokenService.generateRefreshToken(payload);
    const decoded = tokenService.verifyRefreshToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
  });

  it("decodeToken decodes access token without issuer/audience check", () => {
    const token = tokenService.generateAccessToken(payload);
    const decoded = tokenService.decodeToken(token);
    expect(decoded.userId).toBe(payload.userId);
  });
});
