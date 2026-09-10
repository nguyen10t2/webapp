import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
    requestOtpSchema,
    signupInfoSchema,
    verifyOtpSchema,
    type RequestOtpInput,
    type SignupInfoInput,
    type VerifyOtpInput,
} from '@/domain/auth'
import { MAX_OTP_ATTEMPTS, OTP_TTL_MS } from '@/shared/lib/constants'
import { useRequestOtp, useSignin, useSignup, useVerifyOtp } from '@/features/auth/api'
import { apiErrorMessage, formatCountdown, useOtpCountdown } from '@/features/auth/helpers'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { PasswordInput } from '@/shared/ui/password-input'
import { OtpInput } from '@/shared/ui/otp-input'
import { Button } from '@/shared/ui/button'
import { GoogleButton } from '@/features/auth/google-button'

type Step = 'email' | 'otp' | 'info'

/**
 * Đăng ký email 3 bước theo flow backend mới:
 * (1) email → gửi OTP → (2) nhập OTP + verify sớm (không tiêu thụ mã) →
 * (3) tên/mật khẩu → signup → auto-signin.
 *
 * Luật backend FE phải tôn trọng: toàn bộ xong trong 2 phút; tổng lượt nhập sai
 * (verify + signup) tối đa 5 — đủ 5 mã bị hủy, quay về bước 1; gửi lại cách nhau ~60s.
 */
export function SignupWizard() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [step, setStep] = useState<Step>('email')
    const [email, setEmail] = useState('')
    const [attempts, setAttempts] = useState(0)
    const [validUntil, setValidUntil] = useState<number | null>(null)

    const requestOtp = useRequestOtp()
    const verifyOtp = useVerifyOtp()
    const signup = useSignup()
    const signin = useSignin()
    const resend = useOtpCountdown()
    const validity = useOtpCountdown(OTP_TTL_MS)

    const emailForm = useForm<RequestOtpInput>({ resolver: zodResolver(requestOtpSchema) })
    const otpForm = useForm<VerifyOtpInput>({
        resolver: zodResolver(verifyOtpSchema),
        defaultValues: { email: '', otp: '', purpose: 'signup' },
    })
    const infoForm = useForm<SignupInfoInput>({ resolver: zodResolver(signupInfoSchema) })

    const attemptsLeft = MAX_OTP_ATTEMPTS - attempts
    const otpError = otpForm.formState.errors.otp
    const infoErrors = infoForm.formState.errors

    const resetAll = () => {
        setAttempts(0)
        setValidUntil(null)
        otpForm.reset({ email: '', otp: '', purpose: 'signup' })
        // Xóa cả mật khẩu khỏi memory (không để state nhạy cảm tồn tại sau flow).
        infoForm.reset({ fullName: '', password: '', confirmPassword: '' })
    }

    /** Mã bị hủy (sai đủ 5 lần): báo + về bước 1 xin mã mới. */
    const handleDestroyed = () => {
        toast.error(t('auth.otpDestroyed'))
        emailForm.setValue('email', email)
        setEmail('')
        setStep('email')
        resetAll()
    }

    /** Mã hết hạn 2 phút: báo + về bước 1 (giữ email đã nhập). */
    const handleExpired = () => {
        toast.error(t('auth.otpExpired'))
        emailForm.setValue('email', email)
        setEmail('')
        setStep('email')
        resetAll()
    }

    /**
     * Xử lý INVALID_OTP chung cho verify + signup. Trả true nếu đã chuyển bước (hủy/hết hạn),
     * false nếu chỉ cần hiện inline error + cập nhật lượt còn lại.
     */
    const handleInvalidOtp = (): boolean => {
        // Hết hạn theo countdown state (pure) thay vì Date.now() trong handler (oxlint react/purity).
        if (validUntil !== null && validity.secondsLeft <= 0) {
            handleExpired()
            return true
        }
        const next = attempts + 1
        setAttempts(next)
        if (next >= MAX_OTP_ATTEMPTS) {
            handleDestroyed()
            return true
        }
        return false
    }

    const sendOtp = (target: string) => {
        requestOtp.mutate(
            { email: target },
            {
                onSuccess: () => {
                    setEmail(target)
                    setAttempts(0)
                    setValidUntil(Date.now() + OTP_TTL_MS)
                    otpForm.reset({ email: target, otp: '', purpose: 'signup' })
                    resend.start()
                    validity.start()
                    setStep('otp')
                    toast.success(t('auth.otpSent'))
                },
                onError: (error) => {
                    // Email đã có tài khoản → đi signin thay vì signup.
                    if (error.code === 'USER_ALREADY_EXISTS' || error.code === 'CONFLICT') {
                        toast.error(apiErrorMessage(t, error))
                        navigate('/login', { replace: true })
                    } else {
                        toast.error(apiErrorMessage(t, error))
                    }
                },
            },
        )
    }

    const submitOtp = otpForm.handleSubmit((input) => {
        verifyOtp.mutate(input, {
            onSuccess: () => setStep('info'),
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

    const submitInfo = infoForm.handleSubmit((input) => {
        signup.mutate(
            { email, fullName: input.fullName, password: input.password, otp: otpForm.getValues('otp') },
            {
                onSuccess: () => {
                    // Auto-signin: backend chỉ set refresh cookie ở signin/refresh/callback.
                    signin.mutate(
                        { email, password: input.password },
                        {
                            onSuccess: () => {
                                toast.success(t('auth.signupSuccess'))
                                navigate('/', { replace: true })
                            },
                            onError: (error) => toast.error(apiErrorMessage(t, error)),
                        },
                    )
                },
                onError: (error) => {
                    if (error.code === 'USER_ALREADY_EXISTS' || error.code === 'CONFLICT') {
                        toast.error(apiErrorMessage(t, error))
                        navigate('/login', { replace: true })
                    } else if (error.code === 'INVALID_OTP') {
                        // Mã verified trước đó vẫn có thể hết hạn/hủy khi đang nhập tên.
                        if (!handleInvalidOtp()) toast.error(apiErrorMessage(t, error))
                    } else {
                        toast.error(apiErrorMessage(t, error))
                    }
                },
            },
        )
    })

    const stepLabel = step === 'email' ? 1 : step === 'otp' ? 2 : 3

    return (
        <div className="space-y-4">
            <p className="text-base text-muted-foreground">{t('auth.signupStep', { current: stepLabel })}</p>

            {step === 'email' && (
                <>
                    <GoogleButton />
                    <div className="flex items-center gap-4 text-base text-muted-foreground">
                        <span className="h-px flex-1 bg-border" aria-hidden="true" />
                        {t('auth.or')}
                        <span className="h-px flex-1 bg-border" aria-hidden="true" />
                    </div>
                    <form onSubmit={emailForm.handleSubmit((input) => sendOtp(input.email))} noValidate className="space-y-4">
                        <Field
                            label={t('auth.email')}
                            htmlFor="signup-email"
                            error={
                                emailForm.formState.errors.email &&
                                t(emailForm.formState.errors.email.message ?? 'errors.VALIDATION_ERROR')
                            }
                            errorId="signup-email-error"
                        >
                            <Input
                                id="signup-email"
                                type="email"
                                autoComplete="email"
                                placeholder={t('auth.emailPlaceholder')}
                                aria-describedby={emailForm.formState.errors.email ? 'signup-email-error' : undefined}
                                aria-invalid={!!emailForm.formState.errors.email}
                                {...emailForm.register('email')}
                            />
                        </Field>
                        <Button type="submit" disabled={requestOtp.isPending} className="w-full">
                            {requestOtp.isPending ? t('auth.sending') : t('auth.sendOtp')}
                        </Button>
                    </form>
                    <p className="text-center text-base text-muted-foreground">
                        {t('auth.haveAccount')}{' '}
                        <Link to="/login" className="text-primary underline-offset-4 hover:underline">
                            {t('auth.signinLink')}
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
                        htmlFor="signup-otp"
                        hint={t('auth.otpValidFor', { t: formatCountdown(validity.secondsLeft) })}
                        error={otpError && t(otpError.message ?? 'errors.VALIDATION_ERROR')}
                        errorId="signup-otp-error"
                    >
                        <Controller
                            control={otpForm.control}
                            name="otp"
                            render={({ field }) => (
                                <OtpInput
                                    id="signup-otp"
                                    value={field.value}
                                    onChange={field.onChange}
                                    invalid={!!otpError}
                                    describedBy={otpError ? 'signup-otp-error' : undefined}
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
                        disabled={!resend.canResend || requestOtp.isPending}
                        onClick={() => sendOtp(email)}
                        className="w-full"
                    >
                        {resend.canResend ? t('auth.resendOtp') : t('auth.resendIn', { s: resend.secondsLeft })}
                    </Button>
                </form>
            )}

            {step === 'info' && (
                <form onSubmit={submitInfo} noValidate className="space-y-4">
                    <Field
                        label={t('auth.fullName')}
                        htmlFor="signup-name"
                        error={infoErrors.fullName && t(infoErrors.fullName.message ?? 'errors.VALIDATION_ERROR')}
                        errorId="signup-name-error"
                    >
                        <Input
                            id="signup-name"
                            autoComplete="name"
                            placeholder={t('auth.fullNamePlaceholder')}
                            aria-describedby={infoErrors.fullName ? 'signup-name-error' : undefined}
                            aria-invalid={!!infoErrors.fullName}
                            {...infoForm.register('fullName')}
                        />
                    </Field>
                    <Field
                        label={t('auth.password')}
                        htmlFor="signup-password"
                        error={infoErrors.password && t(infoErrors.password.message ?? 'errors.VALIDATION_ERROR')}
                        errorId="signup-password-error"
                    >
                    <PasswordInput
                        id="signup-password"
                        autoComplete="new-password"
                        aria-describedby={infoErrors.password ? 'signup-password-error' : undefined}
                        aria-invalid={!!infoErrors.password}
                        {...infoForm.register('password')}
                    />
                </Field>
                <Field
                    label={t('auth.confirmPassword')}
                    htmlFor="signup-confirm"
                    error={infoErrors.confirmPassword && t(infoErrors.confirmPassword.message ?? 'errors.VALIDATION_ERROR')}
                    errorId="signup-confirm-error"
                >
                    <PasswordInput
                        id="signup-confirm"
                        autoComplete="new-password"
                        aria-describedby={infoErrors.confirmPassword ? 'signup-confirm-error' : undefined}
                        aria-invalid={!!infoErrors.confirmPassword}
                        {...infoForm.register('confirmPassword')}
                    />
                </Field>
                    {attempts > 0 && (
                        <p role="status" className="text-base font-medium text-destructive">
                            {t('auth.attemptsLeft', { n: attemptsLeft })}
                        </p>
                    )}
                    <Button type="submit" disabled={signup.isPending || signin.isPending} className="w-full">
                        {t('auth.verifyAndSignup')}
                    </Button>
                </form>
            )}
        </div>
    )
}
