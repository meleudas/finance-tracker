import { z } from "zod";
import { UserResponseSchema } from "../users/UserResponse.dto";

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: UserResponseSchema,
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;
