import { z } from 'zod'

/**
 * Validation schemas cho groups. Mirror `docs/api.json` + backend `domain/groups/request.rs`.
 * Mọi message lỗi là key i18n (`errors.*`).
 */

export const createGroupSchema = z.object({
    name: z.string().min(1, 'REQUIRED').max(255, 'TOO_LONG'),
    description: z.string().max(1000, 'TOO_LONG').optional(),
    defaultCurrency: z.enum(['USD', 'VND']).optional(),
})
export type CreateGroupInput = z.infer<typeof createGroupSchema>

/** Invite code 4–10 ký tự (`docs/api.json` join-group). */
export const joinGroupSchema = z.object({
    code: z.string().min(4, 'INVITE_CODE_TOO_SHORT').max(10, 'TOO_LONG'),
})
export type JoinGroupInput = z.infer<typeof joinGroupSchema>

/** Thêm member bằng userId (đã lookup từ email) — chỉ ADMIN. */
export const addMemberSchema = z.object({
    userId: z.string().min(1, 'REQUIRED'),
    role: z.enum(['MEMBER', 'ADMIN']).optional(),
})
export type AddMemberInput = z.infer<typeof addMemberSchema>
