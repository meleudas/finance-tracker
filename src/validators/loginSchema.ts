import { z } from "../openapi/zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .check(z.email({ error: "Invalid email address" }))
    .regex(/^[^@]*@(?!.*\.ru$).*$/, { message: "Russian domains are not allowed" })
    .max(255, { message: "Email is too long" })
    .openapi({ example: "user@example.com" }),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .openapi({ example: "StrongPass123!" }),
});

export type LoginSchema = z.infer<typeof loginSchema>;
