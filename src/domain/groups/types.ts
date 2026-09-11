/** Vai trò trong nhóm (backend `GroupRole`). */
export type GroupRole = 'OWNER' | 'ADMIN' | 'MEMBER'

/** Loại chia tiền (backend `SplitType`). */
export type SplitType = 'EQUAL' | 'EXACT' | 'PERCENTAGE'

export type Currency = 'USD' | 'VND'

/** Nhóm — `GET /api/groups` kèm `userBalance` (số dư ròng của mình, đơn vị nhỏ nhất). */
export interface Group {
    id: string
    name: string
    description: string | null
    inviteCode: string
    defaultCurrency: Currency
    createdAt: string
    updatedAt: string
    userBalance?: number
}

/** Số dư ròng từng thành viên trong summary. */
export interface GroupBalance {
    userId: string
    netAmount: number
    fullName: string
}

/** Gợi ý trả nợ tối thiểu (ai trả ai, bao nhiêu). */
export interface SettlementSuggestion {
    fromUserId: string
    toUserId: string
    amount: number
    fromUserName: string
    toUserName: string
}

/** Tổng hợp nhóm — cache backend 60s (`config/constants.rs:34`). */
export interface GroupSummary extends Group {
    balances: GroupBalance[]
    suggestions: SettlementSuggestion[]
}

/** Thành viên nhóm. */
export interface GroupMember {
    groupId: string
    userId: string
    fullName: string
    role: GroupRole
    joinedAt: string
}

/** Quyền UI gating (server vẫn enforce — đây chỉ để ẩn/hiện nút). */
export function isGroupAdmin(role: GroupRole | undefined): boolean {
    return role === 'ADMIN' || role === 'OWNER'
}
