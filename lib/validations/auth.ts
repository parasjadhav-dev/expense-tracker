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

// Change password. The new password follows the same rules as sign-up, and must
// differ from the current one (otherwise the change does nothing).
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters.")
      .max(72, "New password must be 72 characters or fewer."),
    confirmPassword: z.string().min(1, "Type the new password again."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "The two new passwords do not match.",
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ["newPassword"],
    message: "Choose a password different from your current one.",
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Enter your email address."),
  password: z.string().min(1, "Enter your password."),
});
