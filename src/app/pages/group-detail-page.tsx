import type { ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, Copy, Plus, RefreshCw, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useMe } from '@/features/auth/api'
import { useGroup, useGroupMembers } from '@/features/groups/api'
import { SummaryPanel } from '@/features/groups/summary-panel'
import { ExpenseHistory } from '@/features/expenses/expense-history'
import { MemberList } from '@/features/groups/member-list'
import { MemberDebtDialog } from '@/features/groups/member-debt-dialog'
import { initials } from '@/shared/lib/names'
import { isGroupAdmin, type GroupMember } from '@/domain/groups'
import { queryKeys } from '@/infrastructure/query/keys'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/field'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Skeleton } from '@/shared/ui/skeleton'

/** Header 1 section: tiêu đề + nút làm mới riêng (manual refetch, không reload trang). */
function SectionHeader({
    title,
    refreshing,
    onRefresh,
    action,
    children,
}: {
    title: string
    refreshing: boolean
    onRefresh: () => void
    action?: ReactNode
    children: ReactNode
}) {
    const { t } = useTranslation()
    return (
        <section aria-label={title} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-semibold">{title}</h2>
                <div className="flex items-center gap-2">
                    {action}
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={refreshing}
                        onClick={onRefresh}
                        aria-label={t('groups.refresh')}
                    >
                        <RefreshCw className={refreshing ? 'motion-safe:animate-spin' : ''} aria-hidden="true" />
                        {t('groups.refresh')}
                    </Button>
                </div>
            </div>
            {children}
        </section>
    )
}

/** Mã mời gọn cạnh tên nhóm: code mono + nút copy icon (fallback toast khi bị chặn). */
function InlineInviteCode({ code }: { code: string }) {
    const { t } = useTranslation()
    const [copied, setCopied] = useState(false)
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted py-1 pr-1 pl-3">
            <span className="font-mono text-sm font-bold tracking-widest">{code}</span>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                    navigator.clipboard
                        .writeText(code)
                        .then(() => {
                            setCopied(true)
                            toast.success(t('groups.copied'))
                            setTimeout(() => setCopied(false), 2000)
                        })
                        .catch(() => toast.error(t('errors.UNKNOWN_ERROR')))
                }}
                aria-label={t('groups.copyInvite')}
                className="size-7 rounded-full px-0"
            >
                {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            </Button>
        </span>
    )
}

/**
 * Chi tiết nhóm 1 màn hình: header band (mã mời gọn cạnh tên) + layout 2 cột
 * (sidebar thành viên sticky trái, nội dung phải). Không tabs, không cuộn tìm.
 */
export function GroupDetailPage() {
    const { t } = useTranslation()
    const { id = '' } = useParams()
    const queryClient = useQueryClient()

    const me = useMe()
    const group = useGroup(id)
    const members = useGroupMembers(id)
    const [selected, setSelected] = useState<GroupMember | null>(null)
    const myRole = members.data?.find((m) => m.userId === me.data?.id)?.role
    const admin = isGroupAdmin(myRole)

    const summaryFetching = useIsFetching({ queryKey: queryKeys.groupSummary(id) }) > 0
    const expensesFetching = useIsFetching({ queryKey: ['group', id, 'expenses'] }) > 0
    const membersFetching = useIsFetching({ queryKey: queryKeys.groupMembers(id) }) > 0

    if (group.isPending) {
        return (
            <main className="mx-auto w-full max-w-6xl space-y-4 p-4" aria-busy="true" aria-label="Loading">
                <Skeleton className="h-10 w-48 rounded-lg" />
                <Skeleton className="h-64 rounded-lg" />
            </main>
        )
    }

    if (group.isError) {
        return (
            <main className="mx-auto w-full max-w-6xl p-4">
                <Card className="p-6">
                    <p role="alert" className="text-base text-destructive">
                        {t(`errors.${group.error.code}`)}
                    </p>
                    <Link to="/" className="mt-4 inline-block text-primary underline-offset-4 hover:underline">
                        {t('groups.backToGroups')}
                    </Link>
                </Card>
            </main>
        )
    }

    return (
        <main className="mx-auto w-full max-w-6xl space-y-6 p-4">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card/80 p-6 backdrop-blur sm:p-8">
                <div className="bg-dots absolute inset-0" aria-hidden="true" />
                <div
                    className="absolute inset-0 bg-linear-to-br from-primary/15 via-transparent to-transparent"
                    aria-hidden="true"
                />
                <div className="relative">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        {t('groups.backToGroups')}
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{group.data.name}</h1>
                        <InlineInviteCode code={group.data.inviteCode} />
                    </div>
                    {group.data.description && (
                        <p className="mt-1 max-w-2xl text-base text-muted-foreground">{group.data.description}</p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-muted px-3 py-1 font-mono text-sm font-medium text-muted-foreground">
                            {group.data.defaultCurrency}
                        </span>
                        {members.data && (
                            <>
                                <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                                    <Users className="size-4 text-primary" aria-hidden="true" />
                                    {t('groups.memberCount', { n: members.data.length })}
                                </span>
                                <span className="flex" aria-hidden="true">
                                    {members.data.slice(0, 5).map((m, i) => (
                                        <Avatar key={m.userId} className={`size-8 border-2 border-card ${i > 0 ? '-ml-2' : ''}`}>
                                            <AvatarFallback className="text-xs">{initials(m.fullName)}</AvatarFallback>
                                        </Avatar>
                                    ))}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[300px_1fr]">
                <aside aria-label={t('groups.members')} className="space-y-4 lg:sticky lg:top-4">
                    <SectionHeader
                        title={t('groups.members')}
                        refreshing={membersFetching}
                        onRefresh={() => void queryClient.invalidateQueries({ queryKey: queryKeys.groupMembers(id) })}
                        action={
                            admin ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toast.info(t('groups.addMemberSoon'))}
                                >
                                    <Plus aria-hidden="true" />
                                    {t('groups.addMember')}
                                </Button>
                            ) : undefined
                        }
                    >
                        {members.isPending ? (
                            <div aria-busy="true" aria-label="Loading">
                                <Skeleton className="h-16 rounded-lg" />
                            </div>
                        ) : members.isError ? (
                            <p role="alert" className="text-base text-destructive">
                                {t(`errors.${members.error.code}`)}
                            </p>
                        ) : (
                            <MemberList members={members.data} onSelect={setSelected} />
                        )}
                    </SectionHeader>
                </aside>

                <div className="min-w-0 space-y-8">
                    <SectionHeader
                        title={t('groups.overview')}
                        refreshing={summaryFetching}
                        onRefresh={() => void queryClient.invalidateQueries({ queryKey: queryKeys.groupSummary(id) })}
                    >
                        <SummaryPanel groupId={id} currency={group.data.defaultCurrency} />
                    </SectionHeader>

                    <SectionHeader
                        title={t('expenses.title')}
                        refreshing={expensesFetching}
                        onRefresh={() => void queryClient.invalidateQueries({ queryKey: ['group', id, 'expenses'] })}
                        action={
                            <Button asChild>
                                <Link to={`/groups/${id}/expenses/new`}>
                                    <Plus aria-hidden="true" />
                                    {t('expenses.newExpense')}
                                </Link>
                            </Button>
                        }
                    >
                        <ExpenseHistory key={id} groupId={id} currency={group.data.defaultCurrency} />
                    </SectionHeader>
                </div>
            </div>

            <MemberDebtDialog
                member={selected}
                meId={me.data?.id}
                groupId={id}
                currency={group.data.defaultCurrency}
                onClose={() => setSelected(null)}
            />
        </main>
    )
}
