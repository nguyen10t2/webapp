import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AuthLayout } from '@/app/shell/auth-layout'
import { GuestOnly, RequireAuth } from '@/app/guards'
import { RouteError } from '@/app/shell/route-error'

/**
 * Route table. Dùng route `lazy` (không `const X = lazy(...)` ở top-level) để thỏa
 * `react/only-export-components` — file này chỉ export `router` (constant).
 * Phase 1: auth + dashboard placeholder (M2 build dashboard thật).
 * Google callback `{FRONTEND_URL}/login?token=...` được LoginPage đọc `?token=`.
 */
export const router = createBrowserRouter([
    {
        element: <GuestOnly />,
        errorElement: <RouteError />,
        children: [
            {
                element: <AuthLayout />,
                children: [
                    {
                        path: '/login',
                        lazy: () => import('@/app/pages/login-page').then((m) => ({ Component: m.LoginPage })),
                    },
                    {
                        path: '/signup',
                        lazy: () => import('@/app/pages/signup-page').then((m) => ({ Component: m.SignupPage })),
                    },
                    {
                        path: '/forgot-password',
                        lazy: () =>
                            import('@/app/pages/forgot-password-page').then((m) => ({ Component: m.ForgotPasswordPage })),
                    },
                ],
            },
        ],
    },
    {
        element: <RequireAuth />,
        errorElement: <RouteError />,
        children: [
            {
                path: '/',
                lazy: () => import('@/app/pages/dashboard-page').then((m) => ({ Component: m.DashboardPage })),
            },
            {
                path: '/groups/:id',
                lazy: () => import('@/app/pages/group-detail-page').then((m) => ({ Component: m.GroupDetailPage })),
            },
            {
                path: '/groups/:gid/expenses/new',
                lazy: () => import('@/app/pages/new-expense-page').then((m) => ({ Component: m.NewExpensePage })),
            },
            {
                path: '/groups/:gid/expenses/:id',
                lazy: () =>
                    import('@/app/pages/expense-detail-page').then((m) => ({ Component: m.ExpenseDetailPage })),
            },
        ],
    },
    { path: '*', element: <Navigate to="/" replace /> },
])
