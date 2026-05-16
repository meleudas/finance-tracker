import { z } from "zod";
import { userResponseSchema } from "../users/userResponseSchema";

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: userResponseSchema,
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
