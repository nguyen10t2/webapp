import { useTranslation } from 'react-i18next'
import { SignupWizard } from '@/features/auth/signup-wizard'

/** Trang đăng ký email (OTP 2 bước). */
export function SignupPage() {
    const { t } = useTranslation()
    return (
        <div>
            <h1 className="text-3xl font-semibold">{t('auth.signupTitle')}</h1>
            <p className="mt-2 mb-8 text-base text-muted-foreground">{t('auth.signupSubtitle')}</p>
            <SignupWizard />
        </div>
    )
}
