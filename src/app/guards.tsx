import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/infrastructure/auth/auth-store'

function Splash() {
    return (
        <main className="flex min-h-dvh items-center justify-center bg-background" aria-busy="true" aria-label="Loading">
            <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
        </main>
    )
}

/** Chặn route protected: unknown → splash (đang bootstrap), anonymous → /login. */
export function RequireAuth() {
    const status = useAuthStore((s) => s.status)
    const location = useLocation()
    if (status === 'unknown') return <Splash />
    if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location.pathname }} />
    return <Outlet />
}

/** Chặn route guest (login/signup): đã login → về trang chủ. */
export function GuestOnly() {
    const status = useAuthStore((s) => s.status)
    if (status === 'unknown') return <Splash />
    if (status === 'authenticated') return <Navigate to="/" replace />
    return <Outlet />
}
