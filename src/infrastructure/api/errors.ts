/**
 * Lỗi API typed. Giữ nguyên `code` ổn định của backend (`docs/api.json`)
 * để UI map sang i18n thay vì hiển thị message thô.
 */
export class ApiError extends Error {
    readonly code: string
    readonly status: number

    constructor(code: string, status: number, message: string) {
        super(message)
        this.name = 'ApiError'
        this.code = code
        this.status = status
    }
}

/** Mã lỗi backend trả khi access token hết hạn/không hợp lệ. */
export const UNAUTHORIZED = 'UNAUTHORIZED'
/** Mã lỗi khi refresh token hết hạn/bị thu hồi — client phải logout. */
export const INVALID_SESSION = 'INVALID_SESSION'
