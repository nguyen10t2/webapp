import type { Currency, SplitType } from '@/domain/groups/types'

/** 1 phần chia của 1 người trong expense. */
export interface ExpenseShare {
    id: string
    expenseId: string
    userId: string
    /** Chỉ có ở detail (`to_share_response_with_user`). */
    userName?: string | null
    shareAmount: number
    sharePercentage: number | null
    createdAt: string
    updatedAt: string
}

/** Chi tiêu — list trả items KHÔNG kèm shares (`shares: null`), detail có payerName + shares. */
export interface Expense {
    id: string
    groupId: string
    createdById: string
    payerId: string
    payerName: string | null
    amount: number
    currency: Currency
    description: string
    splitType: SplitType
    expenseDate: string
    createdAt: string
    updatedAt: string
    shares: ExpenseShare[] | null
}

/** 1 section tháng trong lịch sử (group client-side từ `expenseDate`). */
export interface ExpenseMonthGroup {
    /** Khóa `YYYY-MM` (UTC) để sort + render header. */
    key: string
    year: number
    month: number
    total: number
    items: Expense[]
}

/**
 * Group expenses đã sort mới-nhất-trước thành sections theo tháng.
 * Pure — test được, không phụ thuộc React/Query.
 */
export function groupExpensesByMonth(expenses: Expense[]): ExpenseMonthGroup[] {
    const buckets = new Map<string, Expense[]>()
    for (const expense of expenses) {
        const date = new Date(expense.expenseDate)
        if (Number.isNaN(date.getTime())) continue
        const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
        const bucket = buckets.get(key)
        if (bucket) bucket.push(expense)
        else buckets.set(key, [expense])
    }
    return [...buckets.entries()]
        .sort(([a], [b]) => (a < b ? 1 : -1))
        .map(([key, items]) => {
            const sorted = [...items].sort((a, b) => (a.expenseDate < b.expenseDate ? 1 : -1))
            const [year, month] = key.split('-').map(Number)
            return {
                key,
                year: year ?? 0,
                month: month ?? 1,
                total: sorted.reduce((sum, e) => sum + e.amount, 0),
                items: sorted,
            }
        })
}

/** Quyền xóa expense: người tạo hoặc admin nhóm (server vẫn enforce). */
export function canDeleteExpense(expense: Expense, meId: string | undefined, admin: boolean): boolean {
    return admin || (meId !== undefined && expense.createdById === meId)
}

/** Envelope phân trang backend (`domain/shared.rs`: `{items, meta}`). */
export interface PageMeta {
    limit: number
    page: number
    total: number
    totalPages: number
}

export interface Paginated<T> {
    items: T[]
    meta: PageMeta
}
