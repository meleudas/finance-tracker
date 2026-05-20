import { DecodedToken } from "../../../types/auth/DecodedToken";
import { TokenPayload } from "../../../types/auth/TokenPayload";

export interface ITokenService {
  generateAccessToken(payload: TokenPayload): string;
  generateRefreshToken(payload: TokenPayload): string;
  verifyAccessToken(token: string): DecodedToken;
  verifyRefreshToken(token: string): DecodedToken;
  decodeToken(token: string): DecodedToken;
}
