import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, toApiError } from '@/infrastructure/api/client'
import { groupEndpoints, userEndpoints } from '@/infrastructure/api/endpoints'
import type { ApiError } from '@/infrastructure/api/errors'
import { useAuthStore } from '@/infrastructure/auth/auth-store'
import { queryKeys } from '@/infrastructure/query/keys'
import type { AddMemberInput, CreateGroupInput, JoinGroupInput } from '@/domain/groups'
import type { Group, GroupMember, GroupSummary } from '@/domain/groups'
import type { AuthUser } from '@/domain/auth'

function onlyAuthenticated() {
    return useAuthStore.getState().status === 'authenticated'
}

/** Danh sách nhóm mình tham gia (kèm `userBalance` từng nhóm). */
export function useGroups() {
    const status = useAuthStore((s) => s.status)
    return useQuery<Group[], ApiError>({
        queryKey: queryKeys.groups,
        queryFn: async (): Promise<Group[]> => {
            try {
                const res = await api.get<Group[]>(groupEndpoints.list)
                return res.data
            } catch (error) {
                throw toApiError(error)
            }
        },
        enabled: status === 'authenticated',
        staleTime: 30_000,
    })
}

/** Chi tiết 1 nhóm (thành viên mới xem được). */
export function useGroup(id: string) {
    return useQuery<Group, ApiError>({
        queryKey: queryKeys.group(id),
        queryFn: async (): Promise<Group> => {
            try {
                const res = await api.get<Group>(groupEndpoints.byId(id))
                return res.data
            } catch (error) {
                throw toApiError(error)
            }
        },
        enabled: onlyAuthenticated() && id.length > 0,
        staleTime: 60_000,
    })
}

/**
 * Summary balances + suggestions. staleTime 60s = TTL cache backend
 * (`config/constants.rs:34`) — set ngắn hơn không cho data mới hơn.
 */
export function useGroupSummary(id: string) {
    return useQuery<GroupSummary, ApiError>({
        queryKey: queryKeys.groupSummary(id),
        queryFn: async (): Promise<GroupSummary> => {
            try {
                const res = await api.get<GroupSummary>(groupEndpoints.summary(id))
                return res.data
            } catch (error) {
                throw toApiError(error)
            }
        },
        enabled: onlyAuthenticated() && id.length > 0,
        staleTime: 60_000,
    })
}

/** Thành viên nhóm — dùng cho list + picker (cache, mở dialog không fetch lại nếu fresh). */
export function useGroupMembers(id: string) {
    return useQuery<GroupMember[], ApiError>({
        queryKey: queryKeys.groupMembers(id),
        queryFn: async (): Promise<GroupMember[]> => {
            try {
                const res = await api.get<GroupMember[]>(groupEndpoints.members(id))
                return res.data
            } catch (error) {
                throw toApiError(error)
            }
        },
        enabled: onlyAuthenticated() && id.length > 0,
        staleTime: 60_000,
    })
}

/** Tạo nhóm (người tạo thành ADMIN). 429 khi vượt 5/user+20/IP/phút. */
export function useCreateGroup() {
    const queryClient = useQueryClient()
    return useMutation<Group, ApiError, CreateGroupInput>({
        mutationFn: async (input: CreateGroupInput): Promise<Group> => {
            try {
                const res = await api.post<Group>(groupEndpoints.create, {
                    name: input.name,
                    description: input.description || undefined,
                    defaultCurrency: input.defaultCurrency || undefined,
                })
                return res.data
            } catch (error) {
                throw toApiError(error)
            }
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.groups })
        },
    })
}

/** Vào nhóm bằng invite code (idempotent — đã vào vẫn 200). */
export function useJoinGroup() {
    const queryClient = useQueryClient()
    return useMutation<Group, ApiError, JoinGroupInput>({
        mutationFn: async (input: JoinGroupInput): Promise<Group> => {
            try {
                const res = await api.post<Group>(groupEndpoints.join, input)
                return res.data
            } catch (error) {
                throw toApiError(error)
            }
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.groups })
        },
    })
}

/** Thêm thành viên (chỉ ADMIN) — đổi số dư/summary nên invalidate cả 2. */
export function useAddMember(groupId: string) {
    const queryClient = useQueryClient()
    return useMutation<GroupMember, ApiError, AddMemberInput>({
        mutationFn: async (input: AddMemberInput): Promise<GroupMember> => {
            try {
                const res = await api.post<GroupMember>(groupEndpoints.members(groupId), {
                    userId: input.userId,
                    role: input.role || undefined,
                })
                return res.data
            } catch (error) {
                throw toApiError(error)
            }
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.groupMembers(groupId) })
            void queryClient.invalidateQueries({ queryKey: queryKeys.groupSummary(groupId) })
        },
    })
}

/** Tra cứu user theo email chính xác (on-demand cho AddMember, không fetch lúc gõ). */
export function useLookupUserByEmail() {
    return useMutation<AuthUser, ApiError, string>({
        mutationFn: async (email: string): Promise<AuthUser> => {
            try {
                const res = await api.get<AuthUser>(userEndpoints.byEmail(email.trim()))
                return res.data
            } catch (error) {
                throw toApiError(error)
            }
        },
    })
}
