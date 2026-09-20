import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import type { GroupMember } from '@/domain/groups'
import { initials } from '@/shared/lib/names'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { cn } from '@/shared/lib/cn'

/**
 * Danh sách thành viên dọc. Truyền `onSelect` để mỗi dòng thành nút bấm
 * mở popup công nợ (không truyền thì chỉ hiển thị).
 */
export function MemberList({ members, onSelect }: { members: GroupMember[]; onSelect?: (m: GroupMember) => void }) {
    const { t } = useTranslation()
    return (
        <ul className="space-y-3">
            {members.map((m) => {
                const isLeft = m.leftAt != null
                const row = (
                    <>
                        <span className="flex min-w-0 items-center gap-3">
                            <Avatar aria-hidden="true" className={cn(isLeft && 'opacity-50 grayscale')}>
                                <AvatarFallback>{initials(m.fullName)}</AvatarFallback>
                            </Avatar>
                            <span className={cn('truncate text-base font-medium', isLeft && 'text-muted-foreground line-through')}>
                                {m.fullName}
                            </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                            <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                                {isLeft ? t('groups.roleLeft') : m.role === 'ADMIN' || m.role === 'OWNER' ? t('groups.roleAdmin') : t('groups.roleMember')}
                            </span>
                            {onSelect && !isLeft && <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />}
                        </span>
                    </>
                )
                return (
                    <li key={m.userId}>
                        {onSelect ? (
                            <button
                                type="button"
                                onClick={() => onSelect(m)}
                                disabled={isLeft}
                                aria-label={`${m.fullName} — ${t('groups.viewDebt')}`}
                                className={cn(
                                    'flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 text-left',
                                    'transition-all duration-150 outline-none hover:-translate-y-0.5 hover:border-ring hover:shadow-lift',
                                    'focus-visible:ring-2 focus-visible:ring-ring motion-reduce:hover:translate-y-0',
                                    isLeft && 'opacity-70 cursor-not-allowed hover:-translate-y-0 hover:shadow-none hover:border-border'
                                )}
                            >
                                {row}
                            </button>
                        ) : (
                            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
                                {row}
                            </div>
                        )}
                    </li>
                )
            })}
        </ul>
    )
}
