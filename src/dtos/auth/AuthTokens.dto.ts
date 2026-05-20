import { z } from "zod";

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type AuthTokensDto = z.infer<typeof AuthTokensSchema>;
