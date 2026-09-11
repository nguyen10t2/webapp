import { useTranslation } from 'react-i18next'
import type { GroupMember } from '@/domain/groups'
import { initials } from '@/shared/lib/names'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'

/** Danh sách thành viên + role badge. */
export function MemberList({ members }: { members: GroupMember[] }) {
    const { t } = useTranslation()
    return (
        <ul className="space-y-3">
            {members.map((m) => (
                <li
                    key={m.userId}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
                >
                    <span className="flex min-w-0 items-center gap-3">
                        <Avatar aria-hidden="true">
                            <AvatarFallback>{initials(m.fullName)}</AvatarFallback>
                        </Avatar>
                        <span className="truncate text-base font-medium">{m.fullName}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                        {m.role === 'ADMIN' || m.role === 'OWNER' ? t('groups.roleAdmin') : t('groups.roleMember')}
                    </span>
                </li>
            ))}
        </ul>
    )
}
