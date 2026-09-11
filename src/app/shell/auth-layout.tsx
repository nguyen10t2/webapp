import { useTranslation } from 'react-i18next'
import { Check, Wallet } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { setLocale } from '@/shared/i18n/config'

/** Locale switcher VI/EN — đồng bộ `Accept-Language` gửi backend qua axios interceptor. */
export function LocaleSwitch() {
    const { i18n } = useTranslation()
    const current = i18n.language.startsWith('vi') ? 'vi' : 'en'
    return (
        <div className="flex gap-1" role="group" aria-label="Language">
            {(['vi', 'en'] as const).map((locale) => (
                <Button
                    key={locale}
                    type="button"
                    variant={current === locale ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setLocale(locale)}
                    aria-pressed={current === locale}
                >
                    {locale.toUpperCase()}
                </Button>
            ))}
        </div>
    )
}

/**
 * Card headline/checklist/proof bên phải (desktop). Nền dùng chung toàn page,
 * component này chỉ render card — không tự vẽ background riêng.
 */
function ArtCard() {
    const { t } = useTranslation()
    const [titleLine1 = '', titleLine2 = ''] = t('auth.heroTitle').split('\n')
    const checks = [t('auth.heroPoint1Title'), t('auth.heroPoint2Title'), t('auth.heroPoint3Title')]
    return (
        <div className="m-auto hidden w-full max-w-lg lg:block" aria-label="SplitDebt">
            <div className="rounded-2xl border border-border bg-card/90 p-10 shadow-sm backdrop-blur">
                <p className="text-4xl font-bold tracking-tight text-card-foreground">
                    {titleLine1}
                    <br />
                    <span className="text-primary">{titleLine2}</span>
                </p>
                    <ul className="mt-8 space-y-4">
                        {checks.map((check) => (
                            <li key={check} className="flex items-center gap-2 text-base text-muted-foreground">
                            <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
                            {check}
                        </li>
                    ))}
                </ul>
                    <p className="mt-8 border-t border-border pt-4 text-sm text-muted-foreground">{t('auth.heroProof')}</p>
            </div>
        </div>
    )
}

/**
 * Layout auth 1 page duy nhất: backdrop hiệu ứng chung full-page (loang sang cả
 * phía form, không tách 2 layout), header full-width (logo trái, locale phải),
 * nội dung 2 cột trên desktop. Không scroll lồng nhau.
 */
export function AuthLayout() {
    return (
        <main className="relative min-h-dvh overflow-hidden bg-background">
            <div className="bg-dots absolute inset-0" aria-hidden="true" />
            <div
                className="absolute inset-0 bg-linear-to-bl from-primary/15 via-background to-background"
                aria-hidden="true"
            />
            <div className="absolute top-1/4 -right-24 size-96 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-24 -left-40 size-96 rounded-full bg-secondary/15 blur-3xl" aria-hidden="true" />
            <div className="relative flex min-h-dvh flex-col">
                <header className="flex w-full items-center justify-between p-4 sm:p-6">
                        <span className="flex items-center gap-2 text-lg font-semibold text-foreground">
                            <Wallet className="size-6 text-primary" aria-hidden="true" />
                            SplitDebt
                        </span>
                    <LocaleSwitch />
                </header>
                <div className="grid flex-1 items-center gap-8 p-4 sm:p-6 lg:grid-cols-2">
                    <div className="mx-auto w-full max-w-md">
                        <Outlet />
                    </div>
                    <ArtCard />
                </div>
            </div>
        </main>
    )
}
