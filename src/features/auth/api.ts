import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, toApiError } from '@/infrastructure/api/client'
import { authEndpoints } from '@/infrastructure/api/endpoints'
import type { ApiError } from '@/infrastructure/api/errors'
import { useAuthStore } from '@/infrastructure/auth/auth-store'
import { queryKeys } from '@/infrastructure/query/keys'
import type {
    AuthUser,
    ForgotOtpInput,
    RequestOtpInput,
    ResetConfirmInput,
    SigninInput,
    SignupInput,
    VerifyOtpInput,
} from '@/domain/auth'

/** Lấy profile — bootstrap sau login/refresh. Chỉ chạy khi đã authenticated. */
export function useMe() {
    const status = useAuthStore((s) => s.status)
    return useQuery({
        queryKey: queryKeys.me,
        queryFn: async (): Promise<AuthUser> => {
            try {
                const res = await api.get<AuthUser>(authEndpoints.me)
                return res.data
            } catch (error) {
                throw toApiError(error)
            }
        },
        enabled: status === 'authenticated',
        staleTime: 5 * 60_000,
    })
}

function useInvalidateSession() {
    const queryClient = useQueryClient()
    return () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.me })
        void queryClient.invalidateQueries({ queryKey: queryKeys.groups })
    }
}

/** Đăng nhập: access token ở body, refresh token ở cookie (backend tự set). */
export function useSignin() {
    const invalidate = useInvalidateSession()
    return useMutation<void, ApiError, SigninInput>({
        mutationFn: async (input: SigninInput): Promise<void> => {
            try {
                const res = await api.post<{ accessToken: string }>(authEndpoints.signin, input)
                useAuthStore.getState().setAccessToken(res.data.accessToken)
                invalidate()
            } catch (error) {
                throw toApiError(error)
            }
        },
    })
}

/** Gửi OTP đăng ký (3 lần/IP/phút — 429 thì UI đếm ngược, không spam). */
export function useRequestOtp() {
    return useMutation<void, ApiError, RequestOtpInput>({
        mutationFn: async (input: RequestOtpInput): Promise<void> => {
            try {
                await api.post(authEndpoints.requestOtp, input)
            } catch (error) {
                throw toApiError(error)
            }
        },
    })
}

/**
 * Verify OTP sớm, KHÔNG tiêu thụ mã (đúng → `{data: true}`, signup sau vẫn dùng được).
 * Sai cộng dồn với signup — đủ 5 lần mã bị hủy phía server.
 */
export function useVerifyOtp() {
    return useMutation<boolean, ApiError, VerifyOtpInput>({
        mutationFn: async (input: VerifyOtpInput): Promise<boolean> => {
            try {
                const res = await api.post<boolean>(authEndpoints.verifyOtp, input)
                return res.data
            } catch (error) {
                throw toApiError(error)
            }
        },
    })
}

/** Tạo user sau đối chiếu OTP. Thành công → caller auto-signin luôn. */
export function useSignup() {    return useMutation<void, ApiError, SignupInput>({
        mutationFn: async (input: SignupInput): Promise<void> => {
            try {
                await api.post(authEndpoints.signup, input)
            } catch (error) {
                throw toApiError(error)
            }
        },
    })
}

/** OTP quên mật khẩu — luôn 200 kể cả email lạ (chống dò email), UI báo "đã gửi" chung. */
export function useForgotOtp() {
    return useMutation<void, ApiError, ForgotOtpInput>({
        mutationFn: async (input: ForgotOtpInput): Promise<void> => {
            try {
                await api.post(authEndpoints.forgotOtp, input)
            } catch (error) {
                throw toApiError(error)
            }
        },
    })
}

/** Đặt mật khẩu mới — đồng thời thu hồi mọi session (caller phải clear cache + về /login). */
export function useResetPassword() {
    const queryClient = useQueryClient()
    return useMutation<void, ApiError, ResetConfirmInput>({
        mutationFn: async (input: ResetConfirmInput): Promise<void> => {
            try {
                // Bảo mật: confirmPassword chỉ để so khớp client-side — strip, không gửi backend.
                const { confirmPassword: _unused, ...body } = input
                void _unused
                await api.post(authEndpoints.resetPassword, body)
                queryClient.clear()
                useAuthStore.getState().reset()
            } catch (error) {
                throw toApiError(error)
            }
        },
    })
}
