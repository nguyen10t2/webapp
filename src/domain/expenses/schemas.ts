import { z } from 'zod'

/**
 * Validation schemas cho expenses. Mirror `docs/api.json` + backend
 * `domain/expenses/{request.rs, strategy.rs}`.
 *
 * Luật split FE phải chặn trước (backend trả 400 BAD_REQUEST nếu sai):
 * - EQUAL: Σ share == amount VÀ mỗi share ∈ {floor(total/n), floor(total/n)+1}
 *   (vd 100/3 người → 33/33/34 hợp lệ, 90/5/5 thì không)
 * - EXACT: Σ share == amount
 * - PERCENTAGE: Σ sharePercentage == 10000 (= 100%, đơn vị % × 100)
 */

export const splitTypeSchema = z.enum(['EQUAL', 'EXACT', 'PERCENTAGE'])
export type SplitType = z.infer<typeof splitTypeSchema>

const shareSchema = z.object({
    userId: z.string().min(1, 'REQUIRED'),
    shareAmount: z.number().int().min(0, 'AMOUNT_TOO_SMALL'),
    sharePercentage: z.number().int().min(0, 'AMOUNT_TOO_SMALL').max(10000, 'TOO_LONG').optional(),
})

export const createExpenseSchema = z
    .object({
        groupId: z.string().min(1, 'REQUIRED'),
        payerId: z.string().min(1, 'REQUIRED'),
        amount: z.number().int().min(1, 'AMOUNT_TOO_SMALL'),
        currency: z.enum(['USD', 'VND']),
        description: z.string().min(1, 'REQUIRED').max(255, 'TOO_LONG'),
        expenseDate: z.string().min(1, 'REQUIRED'),
        splitType: splitTypeSchema,
        shares: z.array(shareSchema).min(1, 'REQUIRED'),
    })
    .superRefine((value, ctx) => {
        const fail = (message: string) =>
            ctx.addIssue({ code: 'custom', message, path: ['shares'] })
        if (value.splitType === 'PERCENTAGE') {
            const total = value.shares.reduce((sum, s) => sum + (s.sharePercentage ?? 0), 0)
            if (total !== 10000) fail('SPLIT_PERCENTAGE_MISMATCH')
            return
        }
        const sum = value.shares.reduce((s, share) => s + share.shareAmount, 0)
        if (sum !== value.amount) {
            fail('SPLIT_SUM_MISMATCH')
            return
        }
        if (value.splitType === 'EQUAL' && value.shares.length > 0) {
            const base = Math.floor(value.amount / value.shares.length)
            const spread = value.shares.every((s) => s.shareAmount === base || s.shareAmount === base + 1)
            if (!spread) fail('SPLIT_EQUAL_INVALID')
        }
    })
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
