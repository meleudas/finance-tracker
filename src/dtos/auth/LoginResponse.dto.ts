import { z } from "zod";
import { UserResponseSchema } from "../users/UserResponse.dto";

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: UserResponseSchema,
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;
