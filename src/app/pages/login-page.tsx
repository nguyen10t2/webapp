import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/infrastructure/auth/auth-store'
import { LoginForm } from '@/features/auth/login-form'

/**
 * Trang đăng nhập. Đọc `?token=` cho Google OAuth callback tương lai
 * (`{FRONTEND_URL}/login?token=...`): có token → vào app + dọn URL sạch.
 */
export function LoginPage() {
    const { t } = useTranslation()
    const [params, setParams] = useSearchParams()
    const setAccessToken = useAuthStore((s) => s.setAccessToken)

    useEffect(() => {
        const token = params.get('token')
        if (token) {
            setAccessToken(token)
            setParams({}, { replace: true })
        }
    }, [params, setAccessToken, setParams])

    return (
        <div>
            <h1 className="text-3xl font-semibold">{t('auth.loginTitle')}</h1>
            <p className="mt-2 mb-8 text-base text-muted-foreground">{t('auth.loginSubtitle')}</p>
            <LoginForm />
        </div>
    )
}
