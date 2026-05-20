import { z } from "zod";
import { userResponseSchema } from "../users/userResponseSchema";

export const authResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: userResponseSchema,
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
