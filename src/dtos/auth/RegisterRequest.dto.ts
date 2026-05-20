import { z } from "zod";

export const RegisterRequestSchema = z.object({
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(100),
});

export type RegisterRequestDto = z.infer<typeof RegisterRequestSchema>;
