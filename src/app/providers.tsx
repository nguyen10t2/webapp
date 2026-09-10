import { Suspense, useEffect, useState } from 'react'
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Toaster } from 'sonner'
import '@/shared/i18n/config'
import { router } from '@/app/router'
import { createQueryClient } from '@/infrastructure/query/client'
import { useAuthStore } from '@/infrastructure/auth/auth-store'
import { bootstrapSession, subscribeCrossTabAuth } from '@/infrastructure/auth/session'

/**
 * Guard chống double-bootstrap của StrictMode: 2 effect cùng lúc chia sẻ 1 promise.
 * Quan trọng vì refresh là rotation có trạng thái — gọi song song 2 lần sẽ tự đá nhau
 * (jti cũ bị thu hồi → INVALID_SESSION → rớt về anonymous oan).
 */
let bootPromise: Promise<void> | null = null

function useSessionLifecycle() {
    const status = useAuthStore((s) => s.status)
    const queryClient = useQueryClient()

    useEffect(() => {
        if (status !== 'unknown') return
        if (!bootPromise) bootPromise = bootstrapSession()
        void bootPromise
    }, [status])

    useEffect(
        () =>
            subscribeCrossTabAuth(() => {
                queryClient.clear()
                useAuthStore.getState().reset()
            }),
        [queryClient],
    )
}

function SessionLifecycle() {
    useSessionLifecycle()
    return null
}

/** Compose providers — giữ `main.tsx` mỏng (chỉ StrictMode + App). */
export function Providers() {
    const [queryClient] = useState(createQueryClient)
    return (
        <QueryClientProvider client={queryClient}>
            <SessionLifecycle />
            <Suspense
                fallback={
                    <main className="flex min-h-dvh items-center justify-center bg-background" aria-busy="true">
                        <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
                    </main>
                }
            >
                <RouterProvider router={router} />
            </Suspense>
            <Toaster position="top-center" richColors closeButton />
        </QueryClientProvider>
    )
}
