import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});
export type SignupValues = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email"),
});
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
