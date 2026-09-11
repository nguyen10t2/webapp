import { useTranslation } from 'react-i18next'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus, Users } from 'lucide-react'
import { useMe } from '@/features/auth/api'
import { useGroup, useGroupMembers } from '@/features/groups/api'
import { SummaryPanel } from '@/features/groups/summary-panel'
import { MemberList } from '@/features/groups/member-list'
import { initials } from '@/shared/lib/names'
import { InviteCodeBox } from '@/features/groups/invite-code-box'
import { AddMemberDialog } from '@/features/groups/add-member-dialog'
import { isGroupAdmin } from '@/domain/groups'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/field'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Skeleton } from '@/shared/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'

/**
 * Chi tiết nhóm: tab Tổng quan (summary) + Thành viên.
 * Nút Thêm thành viên chỉ hiện khi mình là ADMIN (server vẫn enforce).
 */
export function GroupDetailPage() {
    const { t } = useTranslation()
    const { id = '' } = useParams()
    const [params, setParams] = useSearchParams()
    const tab = params.get('tab') === 'members' ? 'members' : 'overview'

    const me = useMe()
    const group = useGroup(id)
    const members = useGroupMembers(id)
    const myRole = members.data?.find((m) => m.userId === me.data?.id)?.role
    const admin = isGroupAdmin(myRole)

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
                    <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{group.data.name}</h1>
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

            <Tabs value={tab} onValueChange={(next) => setParams(next === 'members' ? { tab: 'members' } : {})}>
                <TabsList aria-label={group.data.name}>
                    <TabsTrigger value="overview">{t('groups.overview')}</TabsTrigger>
                    <TabsTrigger value="members">{t('groups.members')}</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                    <SummaryPanel groupId={id} currency={group.data.defaultCurrency} />
                </TabsContent>
                <TabsContent value="members">
                    <div className="space-y-4">
                        <InviteCodeBox code={group.data.inviteCode} />
                        {members.isPending ? (
                            <div aria-busy="true" aria-label="Loading">
                                <Skeleton className="h-16 rounded-lg" />
                            </div>
                        ) : members.isError ? (
                            <p role="alert" className="text-base text-destructive">
                                {t(`errors.${members.error.code}`)}
                            </p>
                        ) : (
                            <MemberList members={members.data} />
                        )}
                        {admin && (
                            <AddMemberDialog
                                groupId={id}
                                trigger={
                                    <Button>
                                        <Plus aria-hidden="true" />
                                        {t('groups.addMember')}
                                    </Button>
                                }
                            />
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </main>
    )
}
