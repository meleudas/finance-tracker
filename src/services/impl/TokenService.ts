import { ITokenService } from "../interfaces/ITokenService";
import { ConfigService } from "../../config/ConfigService";
import { TokenPayload } from "../../types/auth/TokenPayload";
import { sign, SignOptions, verify } from "jsonwebtoken";
import { DecodedToken } from "../../types/auth/DecodedToken";

export class TokenService implements ITokenService {
  constructor(private readonly config: ConfigService) {}

  generateAccessToken(payload: TokenPayload): string {
    return sign(payload, this.config.jwtAccessSecret, {
      expiresIn: this.config.jwtAccessTTL as SignOptions["expiresIn"],
      issuer: this.config.jwtIssuer,
      audience: this.config.jwtAudience,
    });
  }

  generateRefreshToken(payload: TokenPayload): string {
    return sign(payload, this.config.jwtRefreshSecret, {
      expiresIn: this.config.jwtRefreshTTL as SignOptions["expiresIn"],
      issuer: this.config.jwtIssuer,
      audience: this.config.jwtAudience,
    });
  }

  verifyAccessToken(token: string): DecodedToken {
    return verify(token, this.config.jwtAccessSecret, {
      issuer: this.config.jwtIssuer,
      audience: this.config.jwtAudience,
    }) as DecodedToken;
  }

  verifyRefreshToken(token: string): DecodedToken {
    return verify(token, this.config.jwtRefreshSecret, {
      issuer: this.config.jwtIssuer,
      audience: this.config.jwtAudience,
    }) as DecodedToken;
  }

  decodeToken(token: string): DecodedToken {
    return verify(token, this.config.jwtAccessSecret, {
      complete: false,
    }) as DecodedToken;
  }
}
