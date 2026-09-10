import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
    forgotOtpSchema,
    resetConfirmSchema,
    verifyOtpSchema,
    type ForgotOtpInput,
    type ResetConfirmInput,
    type VerifyOtpInput,
} from '@/domain/auth'
import { MAX_OTP_ATTEMPTS, OTP_TTL_MS } from '@/shared/lib/constants'
import { useForgotOtp, useResetPassword, useVerifyOtp } from '@/features/auth/api'
import { apiErrorMessage, formatCountdown, useOtpCountdown } from '@/features/auth/helpers'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { PasswordInput } from '@/shared/ui/password-input'
import { OtpInput } from '@/shared/ui/otp-input'
import { Button } from '@/shared/ui/button'

type Step = 'email' | 'otp' | 'newpw'

/**
 * Quên mật khẩu 3 bước: (1) email → OTP → (2) verify OTP sớm (purpose "reset",
 * không tiêu thụ) → (3) mật khẩu mới + nhập lại → reset.
 *
 * Kênh biên: backend forgot-otp luôn 200 kể cả email lạ (chống dò email) nên FE
 * giữ message chung mọi nhánh — không bao giờ tiết lộ email có tồn tại hay không.
 * confirmPassword chỉ so khớp client-side, bị strip trước khi POST.
 */
export function ForgotFlow() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [step, setStep] = useState<Step>('email')
    const [email, setEmail] = useState('')
    const [attempts, setAttempts] = useState(0)
    const [validUntil, setValidUntil] = useState<number | null>(null)

    const forgotOtp = useForgotOtp()
    const verifyOtp = useVerifyOtp()
    const resetPassword = useResetPassword()
    const resend = useOtpCountdown()
    const validity = useOtpCountdown(OTP_TTL_MS)

    const emailForm = useForm<ForgotOtpInput>({ resolver: zodResolver(forgotOtpSchema) })
    const otpForm = useForm<VerifyOtpInput>({
        resolver: zodResolver(verifyOtpSchema),
        defaultValues: { email: '', otp: '', purpose: 'reset' },
    })
    const confirmForm = useForm<ResetConfirmInput>({
        resolver: zodResolver(resetConfirmSchema),
        defaultValues: { email: '', otp: '', newPassword: '', confirmPassword: '' },
    })

    const attemptsLeft = MAX_OTP_ATTEMPTS - attempts
    const otpError = otpForm.formState.errors.otp
    const confirmErrors = confirmForm.formState.errors

    const resetAll = () => {
        setAttempts(0)
        setValidUntil(null)
        otpForm.reset({ email: '', otp: '', purpose: 'reset' })
        // Xóa mật khẩu khỏi memory ngay (không để state nhạy cảm tồn tại sau flow).
        confirmForm.reset({ email: '', otp: '', newPassword: '', confirmPassword: '' })
    }

    const backToEmail = (expired: boolean) => {
        toast.error(t(expired ? 'auth.otpExpired' : 'auth.otpDestroyed'))
        emailForm.setValue('email', email)
        setEmail('')
        setStep('email')
        resetAll()
    }

    const handleInvalidOtp = (): boolean => {
        if (validUntil !== null && validity.secondsLeft <= 0) {
            backToEmail(true)
            return true
        }
        const next = attempts + 1
        setAttempts(next)
        if (next >= MAX_OTP_ATTEMPTS) {
            backToEmail(false)
            return true
        }
        return false
    }

    const sendOtp = (target: string) => {
        forgotOtp.mutate(
            { email: target },
            {
                onSuccess: () => {
                    setEmail(target)
                    setAttempts(0)
                    setValidUntil(Date.now() + OTP_TTL_MS)
                    otpForm.reset({ email: target, otp: '', purpose: 'reset' })
                    resend.start()
                    validity.start()
                    setStep('otp')
                    // Message chung — không phân biệt email lạ/quen (chống dò email).
                    toast.success(t('auth.otpSent'))
                },
                onError: (error) => toast.error(apiErrorMessage(t, error)),
            },
        )
    }

    const submitOtp = otpForm.handleSubmit((input) => {
        verifyOtp.mutate(input, {
            onSuccess: () => {
                confirmForm.reset({ email, otp: input.otp, newPassword: '', confirmPassword: '' })
                setStep('newpw')
            },
            onError: (error) => {
                if (error.code !== 'INVALID_OTP') {
                    toast.error(apiErrorMessage(t, error))
                    return
                }
                if (!handleInvalidOtp()) {
                    otpForm.setError('otp', { message: apiErrorMessage(t, error) })
                }
            },
        })
    })

    const submitConfirm = confirmForm.handleSubmit((input) => {
        resetPassword.mutate(input, {
            onSuccess: () => {
                toast.success(t('auth.resetSuccess'))
                navigate('/login', { replace: true })
            },
            onError: (error) => {
                if (error.code === 'INVALID_OTP') {
                    if (!handleInvalidOtp()) toast.error(apiErrorMessage(t, error))
                } else {
                    toast.error(apiErrorMessage(t, error))
                }
            },
        })
    })

    const stepLabel = step === 'email' ? 1 : step === 'otp' ? 2 : 3

    return (
        <div className="space-y-4">
            <p className="text-base text-muted-foreground">{t('auth.resetStep', { current: stepLabel })}</p>

            {step === 'email' && (
                <>
                    <form onSubmit={emailForm.handleSubmit((input) => sendOtp(input.email))} noValidate className="space-y-4">
                        <Field
                            label={t('auth.email')}
                            htmlFor="forgot-email"
                            error={
                                emailForm.formState.errors.email &&
                                t(emailForm.formState.errors.email.message ?? 'errors.VALIDATION_ERROR')
                            }
                            errorId="forgot-email-error"
                        >
                            <Input
                                id="forgot-email"
                                type="email"
                                autoComplete="email"
                                placeholder={t('auth.emailPlaceholder')}
                                aria-describedby={emailForm.formState.errors.email ? 'forgot-email-error' : undefined}
                                aria-invalid={!!emailForm.formState.errors.email}
                                {...emailForm.register('email')}
                            />
                        </Field>
                        <Button type="submit" disabled={forgotOtp.isPending} className="w-full">
                            {forgotOtp.isPending ? t('auth.sending') : t('auth.sendOtp')}
                        </Button>
                    </form>
                    <p className="text-center text-base text-muted-foreground">
                        <Link to="/login" className="text-primary underline-offset-4 hover:underline">
                            {t('auth.backToLogin')}
                        </Link>
                    </p>
                </>
            )}

            {step === 'otp' && (
                <form onSubmit={submitOtp} noValidate className="space-y-4">
                    <p className="text-base text-muted-foreground">
                        {email}{' '}
                        <button
                            type="button"
                            onClick={() => {
                                emailForm.setValue('email', email)
                                setEmail('')
                                setStep('email')
                                resetAll()
                            }}
                            className="cursor-pointer text-primary underline-offset-4 hover:underline"
                        >
                            {t('auth.changeEmail')}
                        </button>
                    </p>
                    <Field
                        label={t('auth.otp')}
                        htmlFor="forgot-otp"
                        hint={t('auth.otpValidFor', { t: formatCountdown(validity.secondsLeft) })}
                        error={otpError && t(otpError.message ?? 'errors.VALIDATION_ERROR')}
                        errorId="forgot-otp-error"
                    >
                        <Controller
                            control={otpForm.control}
                            name="otp"
                            render={({ field }) => (
                                <OtpInput
                                    id="forgot-otp"
                                    value={field.value}
                                    onChange={field.onChange}
                                    invalid={!!otpError}
                                    describedBy={otpError ? 'forgot-otp-error' : undefined}
                                />
                            )}
                        />
                    </Field>
                    {attempts > 0 && (
                        <p role="status" className="text-base font-medium text-destructive">
                            {t('auth.attemptsLeft', { n: attemptsLeft })}
                        </p>
                    )}
                    <Button type="submit" disabled={verifyOtp.isPending} className="w-full">
                        {verifyOtp.isPending ? t('auth.verifying') : t('auth.verifyOtp')}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        disabled={!resend.canResend || forgotOtp.isPending}
                        onClick={() => sendOtp(email)}
                        className="w-full"
                    >
                        {resend.canResend ? t('auth.resendOtp') : t('auth.resendIn', { s: resend.secondsLeft })}
                    </Button>
                </form>
            )}

            {step === 'newpw' && (
                <form onSubmit={submitConfirm} noValidate className="space-y-4">
                    <Field
                        label={t('auth.newPassword')}
                        htmlFor="forgot-password"
                        error={confirmErrors.newPassword && t(confirmErrors.newPassword.message ?? 'errors.VALIDATION_ERROR')}
                        errorId="forgot-password-error"
                    >
                        <PasswordInput
                            id="forgot-password"
                            autoComplete="new-password"
                            aria-describedby={confirmErrors.newPassword ? 'forgot-password-error' : undefined}
                            aria-invalid={!!confirmErrors.newPassword}
                            {...confirmForm.register('newPassword')}
                        />
                    </Field>
                    <Field
                        label={t('auth.confirmPassword')}
                        htmlFor="forgot-confirm"
                        error={
                            confirmErrors.confirmPassword &&
                            t(confirmErrors.confirmPassword.message ?? 'errors.VALIDATION_ERROR')
                        }
                        errorId="forgot-confirm-error"
                    >
                        <PasswordInput
                            id="forgot-confirm"
                            autoComplete="new-password"
                            aria-describedby={confirmErrors.confirmPassword ? 'forgot-confirm-error' : undefined}
                            aria-invalid={!!confirmErrors.confirmPassword}
                            {...confirmForm.register('confirmPassword')}
                        />
                    </Field>
                    <Button type="submit" disabled={resetPassword.isPending} className="w-full">
                        {t('auth.resetPassword')}
                    </Button>
                </form>
            )}
        </div>
    )
}
