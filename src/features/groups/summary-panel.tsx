import { useTranslation } from 'react-i18next'
import type { Currency, GroupSummary } from '@/domain/groups'
import { useGroupSummary } from '@/features/groups/api'
import { apiErrorMessage } from '@/features/auth/helpers'
import { balanceTextClass, formatMoney } from '@/shared/lib/money'
import { initials } from '@/shared/lib/names'
import { Card } from '@/shared/ui/field'
import { Skeleton } from '@/shared/ui/skeleton'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { SuggestionsList } from '@/features/groups/suggestions-list'

/** Tổng quan nhóm: bảng công nợ thành viên + gợi ý trả nợ. */
export function SummaryPanel({ groupId, currency }: { groupId: string; currency: Currency }) {
    const { t, i18n } = useTranslation()
    const summary = useGroupSummary(groupId)

    if (summary.isPending) {
        return (
            <div className="space-y-4" aria-busy="true" aria-label="Loading">
                <Skeleton className="h-64 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
            </div>
        )
    }

    if (summary.isError) {
        return (
            <Card className="p-6">
                <p role="alert" className="text-base text-destructive">
                    {apiErrorMessage(t, summary.error)}
                </p>
            </Card>
        )
    }

    const data: GroupSummary = summary.data
    return (
        <div className="space-y-6">
            <section aria-label={t('groups.balances')}>
                <h2 className="mb-3 text-xl font-semibold">{t('groups.balances')}</h2>
                <Card className="overflow-hidden p-0">
                    <table className="w-full text-base">
                        <thead>
                            <tr className="border-b border-border text-left text-sm text-muted-foreground">
                                <th scope="col" className="px-4 py-3 font-medium sm:px-6">
                                    {t('groups.members')}
                                </th>
                                <th scope="col" className="hidden px-4 py-3 font-medium sm:table-cell">
                                    {t('groups.balanceStatus')}
                                </th>
                                <th scope="col" className="px-4 py-3 text-right font-medium sm:px-6">
                                    {t('groups.balances')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...data.balances]
                                .sort((a, b) => b.netAmount - a.netAmount)
                                .map((b) => (
                                    <tr key={b.userId} className="border-b border-border last:border-0">
                                        <td className="px-4 py-3 sm:px-6">
                                            <span className="flex items-center gap-3">
                                                <Avatar className="size-8" aria-hidden="true">
                                                    <AvatarFallback className="text-xs">{initials(b.fullName)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{b.fullName}</span>
                                            </span>
                                        </td>
                                        <td className="hidden px-4 py-3 sm:table-cell">
                                            <span
                                                className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                                                    b.netAmount > 0
                                                        ? 'bg-primary/10 text-primary'
                                                        : b.netAmount < 0
                                                          ? 'bg-destructive/10 text-destructive'
                                                          : 'bg-muted text-muted-foreground'
                                                }`}
                                            >
                                                {b.netAmount > 0
                                                    ? t('groups.toReceive')
                                                    : b.netAmount < 0
                                                      ? t('groups.toPay')
                                                      : t('groups.balanced')}
                                            </span>
                                        </td>
                                        <td
                                            className={`px-4 py-3 text-right font-mono font-bold sm:px-6 ${balanceTextClass(b.netAmount)}`}
                                        >
                                            {formatMoney(b.netAmount, currency, i18n.language)}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </Card>
            </section>
            <section aria-label={t('groups.suggestions')}>
                <h2 className="mb-3 text-xl font-semibold">{t('groups.suggestions')}</h2>
                <SuggestionsList groupId={groupId} suggestions={data.suggestions} currency={currency} />
            </section>
        </div>
    )
}
