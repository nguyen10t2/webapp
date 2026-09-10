/**
 * Hằng số frontend mirror backend `src/config/constants.rs`.
 * Mọi TTL/staleTime import từ đây — cấm magic values lẻ trong features.
 */

/** Cache `GET /api/groups/{id}/summary` phía backend (giây) → staleTime Query bằng đúng giá trị này. */
export const SUMMARY_STALE_MS = 60_000
/** Tuổi thọ mã OTP (2 phút). Toàn bộ flow signup phải xong trong khoảng này. */
export const OTP_TTL_MS = 2 * 60_000
/** Cooldown nút gửi lại OTP (~60s — server chặn 3 mail/giờ/email, đừng để user phí lượt). */
export const RESEND_COOLDOWN_MS = 60_000
/** Tổng lượt nhập sai OTP (verify + signup) trước khi mã bị hủy phía server. */
export const MAX_OTP_ATTEMPTS = 5
/** Tuổi thọ access token (15 phút). Chỉ dùng để proactive-refresh, không thay verify server. */
export const ACCESS_TOKEN_TTL_MS = 15 * 60_000
/** Ngưỡng proactive refresh trước mutation quan trọng khi `exp` còn ít hơn giá trị này. */
export const ACCESS_TOKEN_REFRESH_AHEAD_MS = 60_000
/** Phân trang mặc định/tối đa theo `docs/api.json` (limit kẹp 1–100). */
export const PAGINATION_DEFAULT_LIMIT = 20
export const PAGINATION_MAX_LIMIT = 100
