/**
 * Path builders cho mọi endpoint auth. Không hardcode string URL lẻ trong features.
 * Nguồn: `docs/api.json` (users) + `src/domain/users/handle.rs` (routes).
 */
export const authEndpoints = {
    requestOtp: '/api/users/request-otp',
    verifyOtp: '/api/users/verify-otp',
    signup: '/api/users/signup',
    signin: '/api/users/signin',
    refresh: '/api/users/refresh',
    signout: '/api/users/signout',
    forgotOtp: '/api/users/forgot-password/otp',
    resetPassword: '/api/users/forgot-password/reset',
    me: '/api/users/me',
    changePassword: '/api/users/me/password',
} as const

/** Endpoint có 401 là lỗi credential (sai pass/OTP) — KHÔNG kích hoạt silent refresh. */
export const NO_SILENT_REFRESH_PATHS: readonly string[] = [    authEndpoints.signin,
    authEndpoints.signup,
    authEndpoints.requestOtp,
    authEndpoints.verifyOtp,
    authEndpoints.forgotOtp,
    authEndpoints.resetPassword,
    authEndpoints.refresh,
]

/**
 * Path builders groups. Nguồn: `docs/api.json` (groups).
 * `{id}` là uuid nhóm — luôn `encodeURIComponent` ở caller dùng helper dưới.
 */
export const groupEndpoints = {
    list: '/api/groups',
    create: '/api/groups',
    join: '/api/groups/join',
    byId: (id: string) => `/api/groups/${encodeURIComponent(id)}`,
    summary: (id: string) => `/api/groups/${encodeURIComponent(id)}/summary`,
    members: (id: string) => `/api/groups/${encodeURIComponent(id)}/members`,
} as const

/** Settlements tối thiểu M2 cần (1-click ghi nhận từ suggestion). */
export const settlementEndpoints = {
    create: '/api/settlements',
} as const

/** Tra cứu user theo email chính xác (phục vụ AddMember) — cần đăng nhập. */
export const userEndpoints = {
    byEmail: (email: string) => `/api/users/email/${encodeURIComponent(email)}`,
} as const
