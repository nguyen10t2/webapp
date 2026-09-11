import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

/**
 * Skeleton chuẩn: giữ layout ổn định khi loading, `aria-busy` ở caller,
 * `motion-safe` để tắt nhấp nháy khi reduced-motion (ui-ux-pro-max: loading states).
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div aria-hidden="true" className={cn('rounded-md bg-muted motion-safe:animate-pulse', className)} {...props} />
}
