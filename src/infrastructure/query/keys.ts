/** Query key factory — mọi key tập trung ở đây, cấm string lẻ trong features. */
export const queryKeys = {
    me: ['me'],
    groups: ['groups'],
    group: (id: string) => ['group', id],
    groupSummary: (id: string) => ['group', id, 'summary'],
    groupMembers: (id: string) => ['group', id, 'members'],
    groupExpenses: (id: string, page: number) => ['group', id, 'expenses', page],
    expense: (id: string) => ['expense', id],    groupSettlements: (id: string, page: number) => ['group', id, 'settlements', page],
    userLookup: (key: string) => ['user-lookup', key],
} as const
