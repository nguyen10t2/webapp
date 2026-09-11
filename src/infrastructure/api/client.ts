import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import i18n from '@/shared/i18n/config'
import { useAuthStore } from '@/infrastructure/auth/auth-store'
import { ApiError, INVALID_SESSION, UNAUTHORIZED } from '@/infrastructure/api/errors'
import { NO_SILENT_REFRESH_PATHS, authEndpoints } from '@/infrastructure/api/endpoints'

interface SuccessEnvelope<T> {
    success: true
    message: string
    data?: T
}

interface ErrorEnvelope {
    success: false
    code: string
    message: string
}

interface RetryableConfig extends InternalAxiosRequestConfig {
    _refreshed?: boolean
}

/** Base URL backend — trùng `baseUrl` trong `docs/api.json`. */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

/**
 * Axios instance duy nhất của app. `withCredentials: true` là bắt buộc để trình duyệt
 * gửi/nhận cookie `refreshCookie` (backend CORS `allow_credentials`, `main.rs:53-65`).
 * Mọi network trong features phải đi qua `api` — cấm axios/fetch lẻ.
 */
export const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    // Timeout để request treo (backend chết giữa chừng) thành lỗi hiển thị được,
    // thay vì skeleton quay vô hạn.
    timeout: 15_000,
    headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
        config.headers.set('Authorization', `Bearer ${token}`)
    }
    // Đồng bộ ngôn ngữ với backend `Accept-Language: en | vi` (docs/api.json conventions).
    config.headers.set('Accept-Language', i18n.language.startsWith('vi') ? 'vi' : 'en')
    return config
})

/**
 * Unwrap envelope thành công `{success: true, message, data?}` của backend.
 * Mọi hook đọc `res.data` là dữ liệu thật (`{accessToken}`, `User`, ...), không phải envelope.
 * Response message-only (không có `data`) → `res.data` là `undefined`, caller bỏ qua.
 */
api.interceptors.response.use((response) => {
    const payload = response.data as SuccessEnvelope<unknown> | undefined
    if (payload && payload.success === true) {
        response.data = payload.data
    }
    return response
})

/**
 * Singleflight refresh: mọi request 401 đồng thời chia sẻ đúng 1 promise
 * `POST /api/users/refresh` (cookie tự gửi). Tránh N request đẻ N rotation —
 * backend rotation có trạng thái (thu hồi jti cũ) + trần 5 sessions/user.
 */
let refreshPromise: Promise<string> | null = null

function silentRefresh(): Promise<string> {
    if (!refreshPromise) {
        refreshPromise = axios
            .post<SuccessEnvelope<{ accessToken: string }>>(authEndpoints.refresh, undefined, {
                baseURL: API_BASE_URL,
                withCredentials: true,
            })
            .then((res) => {
                const token = res.data.data?.accessToken
                if (!token) throw new ApiError(INVALID_SESSION, 401, 'Missing access token')
                useAuthStore.getState().setAccessToken(token)
                return token
            })
            .catch((error: unknown) => {
                throw toApiError(error)
            })
            .finally(() => {
                refreshPromise = null
            })
    }
    return refreshPromise
}

function isAuthCredentialPath(url: string | undefined): boolean {
    if (!url) return false
    return NO_SILENT_REFRESH_PATHS.some((path) => url.includes(path))
}

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ErrorEnvelope>) => {
        const original = error.config as RetryableConfig | undefined
        const status = error.response?.status ?? 0

        // 401 trên protected endpoint → thử silent refresh đúng 1 lần rồi retry request gốc.
        if (status === 401 && original && !original._refreshed && !isAuthCredentialPath(original.url)) {
            original._refreshed = true
            try {
                const token = await silentRefresh()
                original.headers.set('Authorization', `Bearer ${token}`)
                return await api.request(original)
            } catch (refreshError) {
                // Refresh fail (hết hạn/bị thu hồi sau đổi pass) → logout, không loop.
                useAuthStore.getState().reset()
                throw refreshError
            }
        }
        throw toApiError(error)
    },
)

/** Chuẩn hóa mọi lỗi axios thành `ApiError` giữ `code` + `status`. Không nuốt context. */
export function toApiError(error: unknown): ApiError {
    if (error instanceof ApiError) return error
    if (axios.isAxiosError(error)) {
        const status = error.response?.status ?? 0
        const data = error.response?.data as ErrorEnvelope | undefined
        if (data && data.success === false) {
            return new ApiError(data.code || UNAUTHORIZED, status, data.message || 'Request failed')
        }
        return new ApiError(status === 0 ? 'NETWORK_ERROR' : UNAUTHORIZED, status, error.message)
    }
    return new ApiError('UNKNOWN_ERROR', 0, error instanceof Error ? error.message : 'Unknown error')
}
