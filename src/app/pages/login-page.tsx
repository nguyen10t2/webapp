import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { bootstrapSession } from '@/infrastructure/auth/session'
import { LoginForm } from '@/features/auth/login-form'

/**
 * Trang đăng nhập. Google OAuth callback về `{FRONTEND_URL}/login?google=success`
 * (backend chỉ set refresh cookie, KHÔNG gửi access token qua URL): thấy flag thì
 * đổi cookie lấy access token qua `POST /refresh` rồi dọn URL sạch.
 */
export function LoginPage() {
    const { t } = useTranslation()
    const [params, setParams] = useSearchParams()

    useEffect(() => {
        if (params.get('google') !== 'success') return
        let cancelled = false
        bootstrapSession().finally(() => {
            if (!cancelled) setParams({}, { replace: true })
        })
        return () => {
            cancelled = true
        }
    }, [params, setParams])

    return (
        <div>
            <h1 className="text-3xl font-semibold">{t('auth.loginTitle')}</h1>
            <p className="mt-2 mb-8 text-base text-muted-foreground">{t('auth.loginSubtitle')}</p>
            <LoginForm />
        </div>
    )
}
