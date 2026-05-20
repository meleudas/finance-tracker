import { z } from "zod";

export const LoginRequestSchema = z.object({
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginRequestDto = z.infer<typeof LoginRequestSchema>;
