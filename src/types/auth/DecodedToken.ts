import { TokenPayload } from "./TokenPayload";

export type DecodedToken = TokenPayload & {
  iat: number;
  exp: number;
};
