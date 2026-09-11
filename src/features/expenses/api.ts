import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, toApiError } from '@/infrastructure/api/client'
import { expenseEndpoints } from '@/infrastructure/api/endpoints'
import type { ApiError } from '@/infrastructure/api/errors'
import { useAuthStore } from '@/infrastructure/auth/auth-store'
import { queryKeys } from '@/infrastructure/query/keys'
import type { CreateExpenseInput, Expense, Paginated } from '@/domain/expenses'
import { PAGINATION_DEFAULT_LIMIT } from '@/shared/lib/constants'

/** Fetch 1 trang expense (dùng chung cho query đơn và multi-page history). */
export async function fetchGroupExpensesPage(groupId: string, page: number): Promise<Paginated<Expense>> {
    try {
        const res = await api.get<Paginated<Expense>>(expenseEndpoints.byGroup(groupId), {
            params: { page, limit: PAGINATION_DEFAULT_LIMIT },
        })
        return res.data
    } catch (error) {
        throw toApiError(error)
    }
}

/**
 * Lịch sử expense của nhóm, phân trang mới-nhất-trước.
 * `keepPreviousData` tương đương: giữ trang cũ khi chuyển trang (không trắng).
 */
export function useGroupExpenses(groupId: string, page: number) {
    const status = useAuthStore((s) => s.status)
    return useQuery<Paginated<Expense>, ApiError>({
        queryKey: queryKeys.groupExpenses(groupId, page),
        queryFn: () => fetchGroupExpensesPage(groupId, page),
        enabled: status === 'authenticated' && groupId.length > 0,
        staleTime: 15_000,
        placeholderData: (previous) => previous,
    })
}

/** Chi tiết expense kèm payerName + shares. */
export function useExpense(id: string) {
    const status = useAuthStore((s) => s.status)
    return useQuery<Expense, ApiError>({
        queryKey: queryKeys.expense(id),
        queryFn: async (): Promise<Expense> => {
            try {
                const res = await api.get<Expense>(expenseEndpoints.byId(id))
                return res.data
            } catch (error) {
                throw toApiError(error)
            }
        },
        enabled: status === 'authenticated' && id.length > 0,
        staleTime: 30_000,
    })
}

/**
 * Tạo expense. Số dư đổi toàn cục nên invalidate expenses (mọi page) +
 * summary + groups + settlements (gợi ý trả nợ có thể đổi).
 */
export function useCreateExpense(groupId: string) {
    const queryClient = useQueryClient()
    return useMutation<Expense, ApiError, CreateExpenseInput>({
        mutationFn: async (input: CreateExpenseInput): Promise<Expense> => {
            try {
                const res = await api.post<Expense>(expenseEndpoints.create, {
                    groupId: input.groupId,
                    payerId: input.payerId,
                    amount: input.amount,
                    currency: input.currency,
                    description: input.description,
                    expenseDate: new Date(input.expenseDate).toISOString(),
                    splitType: input.splitType,
                    shares: input.shares.map((s) => ({
                        userId: s.userId,
                        shareAmount: s.shareAmount,
                        sharePercentage: s.sharePercentage ?? undefined,
                    })),
                })
                return res.data
            } catch (error) {
                throw toApiError(error)
            }
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['group', groupId, 'expenses'] })
            void queryClient.invalidateQueries({ queryKey: queryKeys.groupSummary(groupId) })
            void queryClient.invalidateQueries({ queryKey: queryKeys.groups })
            void queryClient.invalidateQueries({ queryKey: ['group', groupId, 'settlements'] })
        },
    })
}

/** Xóa mềm expense (creator/admin). Xong về list nên invalidate + caller navigate. */
export function useDeleteExpense(groupId: string) {
    const queryClient = useQueryClient()
    return useMutation<void, ApiError, string>({
        mutationFn: async (id: string): Promise<void> => {
            try {
                await api.delete(expenseEndpoints.byId(id))
            } catch (error) {
                throw toApiError(error)
            }
        },
        onSuccess: (_data, id) => {
            void queryClient.invalidateQueries({ queryKey: ['group', groupId, 'expenses'] })
            void queryClient.invalidateQueries({ queryKey: queryKeys.groupSummary(groupId) })
            void queryClient.invalidateQueries({ queryKey: queryKeys.groups })
            queryClient.removeQueries({ queryKey: queryKeys.expense(id) })
        },
    })
}
