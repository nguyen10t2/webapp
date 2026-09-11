import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowDownLeft, ArrowUpRight, Layers, LogOut, Plus, Ticket, Wallet } from 'lucide-react'
import { useMe } from '@/features/auth/api'
import { useGroups } from '@/features/groups/api'
import { NetPositionCard } from '@/features/groups/net-position-card'
import { GroupCard } from '@/features/groups/group-card'
import { CreateGroupDialog } from '@/features/groups/create-group-dialog'
import { JoinGroupDialog } from '@/features/groups/join-group-dialog'
import { signOutEverywhere } from '@/infrastructure/auth/session'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/field'
import { Skeleton } from '@/shared/ui/skeleton'
import { LocaleSwitch } from '@/app/shell/auth-layout'

/** Dashboard: hero slogan + vị thế ròng + lưới nhóm + tạo/vào nhóm. */
export function DashboardPage() {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const me = useMe()
    const groups = useGroups()

    return (
        <main className="relative min-h-dvh overflow-hidden bg-background">
            <div
                className="absolute inset-0 bg-linear-to-bl from-primary/10 via-background to-background"
                aria-hidden="true"
            />
            <div className="absolute -top-24 right-1/4 size-96 rounded-full bg-primary/15 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-32 -left-24 size-96 rounded-full bg-secondary/10 blur-3xl" aria-hidden="true" />
            <div className="relative">
                <header className="mx-auto flex w-full max-w-6xl items-center justify-between p-4">
                    <span className="flex items-center gap-2 font-semibold text-foreground">
                        <Wallet className="size-5 text-primary" aria-hidden="true" />
                        SplitDebt
                    </span>
                    <div className="flex items-center gap-2">
                        <LocaleSwitch />
                        <Button variant="outline" size="sm" onClick={() => void signOutEverywhere(() => queryClient.clear())}>
                            <LogOut aria-hidden="true" />
                            Sign out
                        </Button>
                    </div>
                </header>
                <section className="mx-auto w-full max-w-6xl space-y-6 p-4">
                    <div className="relative overflow-hidden rounded-2xl border border-border bg-card/80 p-6 backdrop-blur sm:p-8">
                        <div className="bg-dots absolute inset-0" aria-hidden="true" />
                        <div
                            className="absolute inset-0 bg-linear-to-br from-primary/15 via-transparent to-transparent"
                            aria-hidden="true"
                        />
                        <Wallet
                            className="absolute -right-8 -bottom-10 size-48 text-primary/10"
                            aria-hidden="true"
                        />
                        <div className="relative">
                            <p className="text-sm font-medium text-primary">
                                {t('groups.title')}
                                {me.data ? <span className="text-muted-foreground"> — {me.data.fullName}</span> : ''}
                            </p>
                            <h1 className="mt-2 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
                                {t('groups.homeSlogan')}
                            </h1>
                            {groups.data && groups.data.length > 0 && (
                                <ul className="mt-4 flex flex-wrap gap-2" aria-label="Statistics">
                                    <li className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                                        <Layers className="size-4 text-primary" aria-hidden="true" />
                                        {t('groups.statGroups', { n: groups.data.length })}
                                    </li>
                                    <li className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                                        <ArrowDownLeft className="size-4 text-primary" aria-hidden="true" />
                                        {t('groups.statOwed', {
                                            n: groups.data.filter((g) => (g.userBalance ?? 0) > 0).length,
                                        })}
                                    </li>
                                    <li className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                                        <ArrowUpRight className="size-4 text-destructive" aria-hidden="true" />
                                        {t('groups.statOwing', {
                                            n: groups.data.filter((g) => (g.userBalance ?? 0) < 0).length,
                                        })}
                                    </li>
                                </ul>
                            )}
                            <div className="mt-5 flex flex-wrap gap-2">
                                <CreateGroupDialog
                                    trigger={
                                        <Button>
                                            <Plus aria-hidden="true" />
                                            {t('groups.createGroup')}
                                        </Button>
                                    }
                                />
                                <JoinGroupDialog
                                    trigger={
                                        <Button variant="outline">
                                            <Ticket aria-hidden="true" />
                                            {t('groups.joinGroup')}
                                        </Button>
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {groups.isPending ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading">
                            {[0, 1, 2].map((i) => (
                                <Skeleton key={i} className="h-36 rounded-lg" />
                            ))}
                        </div>
                    ) : groups.isError ? (
                        <Card className="p-6">
                            <p role="alert" className="text-base text-destructive">
                                {t(`errors.${groups.error.code}`)}
                            </p>
                        </Card>
                    ) : groups.data.length === 0 ? (
                        <Card className="relative space-y-2 overflow-hidden p-8 text-center">
                            <Wallet className="mx-auto size-12 text-primary/30" aria-hidden="true" />
                            <p className="text-xl font-semibold">{t('groups.emptyTitle')}</p>
                            <p className="mx-auto max-w-md text-base text-muted-foreground">{t('groups.emptySubtitle')}</p>
                        </Card>
                    ) : (
                        <>
                            <NetPositionCard groups={groups.data} />
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {groups.data.map((group) => (
                                    <GroupCard key={group.id} group={group} />
                                ))}
                            </div>
                        </>
                    )}
                </section>
            </div>
        </main>
    )
}
