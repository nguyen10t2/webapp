import { useTranslation } from 'react-i18next'
import { TriangleAlert } from 'lucide-react'
import { useRouteError } from 'react-router-dom'
import { Button } from '@/shared/ui/button'

/**
 * Fallback khi route/link lazy import lỗi (mất mạng giữa chừng, HMR race, chunk lỗi):
 * hiện panel tải lại thay vì crash trắng trang.
 */
export function RouteError() {
    const { t } = useTranslation()
    const error = useRouteError()
    if (import.meta.env.DEV) console.error('route error', error)
    return (
        <main className="flex min-h-dvh items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm space-y-4 text-center">
                <TriangleAlert className="mx-auto size-10 text-destructive" aria-hidden="true" />
                <h1 className="text-2xl font-semibold text-foreground">{t('routeError.title')}</h1>
                <p className="text-base text-muted-foreground">{t('routeError.subtitle')}</p>
                <Button onClick={() => window.location.reload()} className="w-full">
                    {t('routeError.retry')}
                </Button>
            </div>
        </main>
    )
}
