import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, toApiError } from '@/infrastructure/api/client'
import { settlementEndpoints } from '@/infrastructure/api/endpoints'
import type { ApiError } from '@/infrastructure/api/errors'
import { queryKeys } from '@/infrastructure/query/keys'
import type { RecordSettlementInput, Settlement } from '@/domain/settlements'

/**
 * Ghi nhận trả nợ (M2: 1-click từ suggestion). Ghi xong số dư đổi nên invalidate
 * settlements + summary + groups (userBalance). M4 mở rộng list/cancel.
 */
export function useRecordSettlement(groupId: string) {
    const queryClient = useQueryClient()
    return useMutation<Settlement, ApiError, RecordSettlementInput>({
        mutationFn: async (input: RecordSettlementInput): Promise<Settlement> => {
            try {
                const res = await api.post<Settlement>(settlementEndpoints.create, input)
                return res.data
            } catch (error) {
                throw toApiError(error)
            }
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.groupSummary(groupId) })
            void queryClient.invalidateQueries({ queryKey: queryKeys.groups })
        },
    })
}
