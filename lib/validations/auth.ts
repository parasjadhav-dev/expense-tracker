import { z } from "zod";

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .max(100, "Name must be 100 characters or fewer.")
    .optional()
    .transform((value) => (value ? value : undefined)),
  // Trim and lowercase before format checks, so "  Me@Example.com " is accepted.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(
      z
        .email("Enter a valid email address.")
        .max(254, "Email must be 254 characters or fewer."),
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be 72 characters or fewer."),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Enter your email address."),
  password: z.string().min(1, "Enter your password."),
});
