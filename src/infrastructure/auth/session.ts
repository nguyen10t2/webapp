import { api } from '@/infrastructure/api/client'
import { authEndpoints } from '@/infrastructure/api/endpoints'
import { toApiError } from '@/infrastructure/api/client'
import { useAuthStore } from '@/infrastructure/auth/auth-store'

const AUTH_CHANNEL = 'sd-auth'

function broadcastAuth(message: 'logout' | 'login'): void {
    try {
        new BroadcastChannel(AUTH_CHANNEL).postMessage(message)
    } catch {
        // BroadcastChannel không khả dụng (SSR/test cũ) — bỏ qua, tab hiện tại vẫn đúng.
    }
}

/**
 * Đăng ký listener liên-tab: tab này logout → các tab khác clear token ngay,
 * không đợi request 401. Gọi 1 lần ở providers. Trả hàm cleanup.
 */
export function subscribeCrossTabAuth(onLogout: () => void): () => void {
    let channel: BroadcastChannel | null = null
    try {
        channel = new BroadcastChannel(AUTH_CHANNEL)
    } catch {
        return () => undefined
    }
    channel.onmessage = (event: MessageEvent<string>) => {
        if (event.data === 'logout') onLogout()
    }
    return () => channel?.close()
}

/**
 * Boot khi F5/mở tab: memory rỗng là bình thường → đổi refresh cookie
 * (trình duyệt tự gửi) lấy access mới. Fail = anonymous, về /login.
 */
export async function bootstrapSession(): Promise<void> {
    const { accessToken, setAccessToken, markAnonymous } = useAuthStore.getState()
    if (accessToken) return
    try {
        const res = await api.post<{ accessToken: string }>(authEndpoints.refresh)
        setAccessToken(res.data.accessToken)
    } catch {
        markAnonymous()
    }
}

/** Đăng xuất: thu hồi session server (idempotent) + clear local + báo các tab khác. */
export async function signOutEverywhere(clearCache: () => void): Promise<void> {
    try {
        await api.post(authEndpoints.signout)
    } catch (error) {
        // Signout idempotent — lỗi mạng cũng vẫn logout local.
        if (import.meta.env.DEV) console.warn('signout failed, logging out locally', toApiError(error).code)
    } finally {
        clearCache()
        useAuthStore.getState().reset()
        broadcastAuth('logout')
    }
}
