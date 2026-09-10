import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { LogOut, Wallet } from 'lucide-react'
import { useMe } from '@/features/auth/api'
import { signOutEverywhere } from '@/infrastructure/auth/session'
import { Button } from '@/shared/ui/button'
import { LocaleSwitch } from '@/app/shell/auth-layout'

/**
 * Dashboard placeholder phase 1 (M2 build dashboard thật: NetPosition + GroupGrid).
 * Hiện tại chỉ xác nhận login thành công + me + signout hoạt động.
 */
export function DashboardPage() {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const me = useMe()

    return (
        <main className="min-h-dvh bg-background">
            <header className="mx-auto flex w-full max-w-6xl items-center justify-between p-4">
                <span className="flex items-center gap-2 font-semibold text-foreground">
                    <Wallet className="size-5 text-primary" aria-hidden="true" />
                    SplitDebt
                </span>
                <div className="flex items-center gap-2">
                    <LocaleSwitch />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void signOutEverywhere(() => queryClient.clear())}
                    >
                        <LogOut aria-hidden="true" />
                        Sign out
                    </Button>
                </div>
            </header>
            <section className="mx-auto w-full max-w-6xl p-4">
                <h1 className="text-2xl font-semibold">
                    {t('auth.loginSuccess')} {me.data ? `— ${me.data.fullName}` : ''}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">Dashboard groups/expenses về ở milestone M2.</p>
            </section>
        </main>
    )
}
