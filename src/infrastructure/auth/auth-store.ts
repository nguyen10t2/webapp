import { create } from 'zustand'

export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous'

interface AuthState {
    /** Access token CHỈ trong memory — không localStorage/sessionStorage (miễn nhiễm XSS-persistence). */
    accessToken: string | null
    status: AuthStatus
    setAccessToken: (token: string) => void
    markAnonymous: () => void
    /** Xóa token + đánh anonymous (dùng khi refresh fail / signout / đổi pass). */
    reset: () => void
}

/**
 * Zustand store duy nhất giữ auth. Single-writer đã justify (auth là cross-cutting).
 * KHÔNG bỏ server data (user, groups...) vào đây — đó là việc của TanStack Query.
 */
export const useAuthStore = create<AuthState>()((set) => ({
    accessToken: null,
    status: 'unknown',
    setAccessToken: (token: string) => set({ accessToken: token, status: 'authenticated' }),
    markAnonymous: () => set({ accessToken: null, status: 'anonymous' }),
    reset: () => set({ accessToken: null, status: 'anonymous' }),
}))
