import { QueryClient } from '@tanstack/react-query'

/**
 * QueryClient toàn app. `refetchOnWindowFocus: false` có chủ ý: mỗi refetch khi
 * focus có thể dính access hết hạn → kéo theo refresh rotation không cần thiết.
 * Data mới lấy qua invalidation có mục tiêu (docs/frontend-design/03-state-management.md).
 */
export function createQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: (failureCount, error) => {
                    const status = (error as { status?: number }).status ?? 0
                    // 401/403/422/429 retry vô ích (hết hạn/sai quyền/sai data/rate-limit).
                    if ([401, 403, 422, 429].includes(status)) return false
                    return failureCount < 1
                },
                refetchOnWindowFocus: false,
                refetchOnReconnect: true,
            },
            mutations: { retry: false },
        },
    })
}
