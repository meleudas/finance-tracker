import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .check(z.email({ error: "Invalid email address" }))
    .regex(/^[^@]*@(?!.*\.ru$).*$/, { message: "Russian domains are not allowed" })
    .max(255, { message: "Email is too long" })
    .openapi({ example: "user@example.com" }),

  password: z
    .string()
    .min(8, { message: "Must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter" })
    .regex(/\d/, { message: "Must contain at least one number" })
    .regex(/[!@#$%^&*(),.?":{}|<>]/, { message: "Must contain at least one special character" })
    .openapi({ example: "StrongPass123!" }),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
