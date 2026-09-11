import { z } from 'zod'
import type { Currency } from '@/domain/groups/types'

/** Ghi nhận trả nợ giữa 2 thành viên (`POST /api/settlements`). */
export const recordSettlementSchema = z.object({
    groupId: z.string().min(1, 'REQUIRED'),
    senderId: z.string().min(1, 'REQUIRED'),
    receiverId: z.string().min(1, 'REQUIRED'),
    amount: z.number().int().min(1, 'AMOUNT_TOO_SMALL'),
    currency: z.enum(['USD', 'VND']),
})
export type RecordSettlementInput = z.infer<typeof recordSettlementSchema>

export interface Settlement {
    id: string
    groupId: string
    senderId: string
    senderName: string | null
    receiverId: string
    receiverName: string | null
    amount: number
    currency: Currency
    settledAt: string
    createdAt: string
}
