import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { signinSchema, type SigninInput } from '@/domain/auth'
import { useSignin } from '@/features/auth/api'
import { apiErrorMessage } from '@/features/auth/helpers'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { PasswordInput } from '@/shared/ui/password-input'
import { Button } from '@/shared/ui/button'
import { GoogleButton } from '@/features/auth/google-button'

/** Form đăng nhập email/password. 401 sai credential → inline error, không silent-refresh. */
export function LoginForm() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const signin = useSignin()
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<SigninInput>({ resolver: zodResolver(signinSchema) })

    const onSubmit = handleSubmit((input) => {
        signin.mutate(input, {
            onSuccess: () => {
                toast.success(t('auth.loginSuccess'))
                navigate('/', { replace: true })
            },
            onError: (error) => {
                // Sai credential là lỗi của field password — inline thay vì toast chung.
                if (error.code === 'INVALID_CREDENTIALS' || error.code === 'VALIDATION_ERROR') {
                    setError('password', { message: apiErrorMessage(t, error) })
                } else {
                    toast.error(apiErrorMessage(t, error))
                }
            },
        })
    })

    return (
        <div className="space-y-4">
            <GoogleButton />
            <div className="flex items-center gap-4 text-base text-muted-foreground">
                <span className="h-px flex-1 bg-border" aria-hidden="true" />
                {t('auth.or')}
                <span className="h-px flex-1 bg-border" aria-hidden="true" />
            </div>
            <form onSubmit={onSubmit} noValidate className="space-y-4">
                <Field
                    label={t('auth.email')}
                    htmlFor="login-email"
                    error={errors.email && t(errors.email.message ?? 'errors.VALIDATION_ERROR')}
                    errorId="login-email-error"
                >
                    <Input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        placeholder={t('auth.emailPlaceholder')}
                        aria-describedby={errors.email ? 'login-email-error' : undefined}
                        aria-invalid={!!errors.email}
                        {...register('email')}
                    />
                </Field>
                <Field
                    label={t('auth.password')}
                    htmlFor="login-password"
                    error={errors.password && t(errors.password.message ?? 'errors.VALIDATION_ERROR')}
                    errorId="login-password-error"
                >
                    <PasswordInput
                        id="login-password"
                        aria-describedby={errors.password ? 'login-password-error' : undefined}
                        aria-invalid={!!errors.password}
                        {...register('password')}
                    />
                </Field>
                <div className="flex justify-end">
                    <Link to="/forgot-password" className="text-sm text-primary underline-offset-4 hover:underline">
                        {t('auth.forgotPassword')}
                    </Link>
                </div>
                <Button type="submit" disabled={signin.isPending} className="w-full">
                    {signin.isPending ? t('auth.signingIn') : t('auth.signin')}
                </Button>
            </form>
            <p className="text-center text-base text-muted-foreground">
                {t('auth.noAccount')}{' '}
                <Link to="/signup" className="text-primary underline-offset-4 hover:underline">
                    {t('auth.signupLink')}
                </Link>
            </p>
        </div>
    )
}
