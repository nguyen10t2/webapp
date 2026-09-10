import { useTranslation } from 'react-i18next'
import { ForgotFlow } from '@/features/auth/forgot-flow'

/** Trang quên mật khẩu (OTP 2 bước). */
export function ForgotPasswordPage() {
    const { t } = useTranslation()
    return (
        <div>
            <h1 className="text-3xl font-semibold">{t('auth.forgotTitle')}</h1>
            <p className="mt-2 mb-8 text-base text-muted-foreground">{t('auth.forgotSubtitle')}</p>
            <ForgotFlow />
        </div>
    )
}
