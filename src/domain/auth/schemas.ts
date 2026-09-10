import { z } from 'zod'

/**
 * Validation schemas cho auth (pipes zod, pure — không import React/router/store).
 * Mirror `docs/api.json` + backend `src/domain/users/request.rs`.
 * Clean Architecture: schemas sống ở domain, features chỉ consume qua react-hook-form.
 * Mọi message lỗi là key i18n (`errors.*`), không hardcode câu chữ.
 */

/** Pattern email thực dụng (trùng ý nghĩa với codec `z.email()` của Zod v4). */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const emailSchema = z
    .string()
    // KHÔNG dùng `.email()` — overload này deprecated từ Zod v4 (dùng `z.email()` top-level).
    // `min` + `refine` giữ được 2 mã lỗi riêng: trống → REQUIRED, sai format → INVALID_EMAIL.
    .min(1, 'REQUIRED')
    .refine((value) => EMAIL_PATTERN.test(value), 'INVALID_EMAIL')

/** OTP 6 ký tự, hiệu lực 2 phút (backend `config/constants.rs:38`). */
export const otpSchema = z.string().length(6, 'INVALID_OTP_LENGTH')

const passwordSchema = z.string().min(6, 'PASSWORD_TOO_SHORT')

/** So khớp mật khẩu nhập lại — CHỈ client-side, không bao giờ gửi backend. */
const confirmPasswordSchema = z.string().min(1, 'REQUIRED')

function passwordsMatch<T extends { password: string; confirmPassword: string }>(value: T, ctx: z.RefinementCtx) {
    if (value.password !== value.confirmPassword) {
        ctx.addIssue({ code: 'custom', message: 'PASSWORD_MISMATCH', path: ['confirmPassword'] })
    }
}

export const requestOtpSchema = z.object({ email: emailSchema })
export type RequestOtpInput = z.infer<typeof requestOtpSchema>

/**
 * Verify OTP sớm, không tiêu thụ mã (`POST /api/users/verify-otp`).
 * `purpose` phân biệt 2 loại mã độc lập (signup/reset) — chống dùng lẫn (kênh biên).
 */
export const verifyOtpSchema = z.object({
    email: emailSchema,
    otp: otpSchema,
    purpose: z.enum(['signup', 'reset']),
})
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>

export const signupSchema = z.object({
    email: emailSchema,
    fullName: z.string().min(1, 'REQUIRED').max(255, 'TOO_LONG'),
    password: passwordSchema,
    otp: otpSchema,
})
export type SignupInput = z.infer<typeof signupSchema>

/** Bước cuối wizard signup: tên + mật khẩu + nhập lại (email/otp đã chốt trước đó). */
export const signupInfoSchema = signupSchema
    .pick({ fullName: true, password: true })
    .extend({ confirmPassword: confirmPasswordSchema })
    .superRefine(passwordsMatch)
export type SignupInfoInput = z.infer<typeof signupInfoSchema>

export const signinSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'REQUIRED'),
})
export type SigninInput = z.infer<typeof signinSchema>

export const forgotOtpSchema = z.object({ email: emailSchema })
export type ForgotOtpInput = z.infer<typeof forgotOtpSchema>

/**
 * Bước cuối forgot-password: mật khẩu mới + nhập lại.
 * `confirmPassword` bị strip trước khi POST — backend chỉ nhận `{email, otp, newPassword}`.
 */
export const resetConfirmSchema = z
    .object({
        email: emailSchema,
        otp: otpSchema,
        newPassword: passwordSchema,
        confirmPassword: confirmPasswordSchema,
    })
    .superRefine((value, ctx) =>
        passwordsMatch({ password: value.newPassword, confirmPassword: value.confirmPassword }, ctx),
    )
export type ResetConfirmInput = z.infer<typeof resetConfirmSchema>
