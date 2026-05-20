import { TokenPayload } from "../../types/auth/TokenPayload";
import { DecodedToken } from "../../types/auth/DecodedToken";

export interface ITokenService {
  generateAccessToken(payload: TokenPayload): string;
  generateRefreshToken(payload: TokenPayload): string;
  verifyAccessToken(token: string): DecodedToken;
  verifyRefreshToken(token: string): DecodedToken;
  decodeToken(token: string): DecodedToken;
}
