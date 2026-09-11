import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import type { GroupMember } from '@/domain/groups'
import type { Currency } from '@/domain/groups/types'
import { useGroupSummary } from '@/features/groups/api'
import { apiErrorMessage } from '@/features/auth/helpers'
import { balanceTextClass, formatMoney } from '@/shared/lib/money'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Skeleton } from '@/shared/ui/skeleton'

/**
 * Popup công nợ khi nhấn 1 thành viên:
 * - Nhấn người khác: quan hệ trực tiếp mình ↔ họ (suy từ suggestions trả nợ tối thiểu).
 * - Nhấn chính mình: tổng công nợ của mình (số dư ròng + mọi suggestion liên quan).
 * Pairwise chính xác tuyệt đối cần ledger — ở đây dùng suggestions (đủ cho trả nợ thực tế).
 */
export function MemberDebtDialog({
    member,
    meId,
    groupId,
    currency,
    onClose,
}: {
    member: GroupMember | null
    meId: string | undefined
    groupId: string
    currency: Currency
    onClose: () => void
}) {
    const { t, i18n } = useTranslation()
    const summary = useGroupSummary(groupId)
    const isMe = member !== null && meId !== undefined && member.userId === meId

    const fmt = (amount: number) => formatMoney(amount, currency, i18n.language)
    const balances = summary.data?.balances ?? []
    const suggestions = summary.data?.suggestions ?? []
    const netOf = (userId: string) => balances.find((b) => b.userId === userId)?.netAmount ?? 0
    const involvingMe = suggestions.filter((s) => s.fromUserId === meId || s.toUserId === meId)
    const direct =
        member === null
            ? []
            : suggestions.filter(
                  (s) =>
                      (s.fromUserId === meId && s.toUserId === member.userId) ||
                      (s.fromUserId === member.userId && s.toUserId === meId),
              )

    return (
        <Dialog open={member !== null} onOpenChange={(open) => !open && onClose()}>
            <DialogContent aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle>
                        {member && (isMe ? t('groups.myDebts') : t('groups.debtWith', { name: member.fullName }))}
                    </DialogTitle>
                </DialogHeader>
                {summary.isPending ? (
                    <div className="space-y-2" aria-busy="true" aria-label="Loading">
                        <Skeleton className="h-12 rounded-lg" />
                        <Skeleton className="h-12 rounded-lg" />
                    </div>
                ) : summary.isError || !member ? (
                    <p role="alert" className="text-base text-destructive">
                        {summary.isError ? apiErrorMessage(t, summary.error) : ''}
                    </p>
                ) : isMe ? (
                    <div className="space-y-3">
                        <p className="flex items-center justify-between text-base">
                            <span className="text-muted-foreground">{t('groups.netBalance')}</span>
                            <span className={`font-mono font-bold ${balanceTextClass(netOf(member.userId))}`}>
                                {fmt(netOf(member.userId))}
                            </span>
                        </p>
                        {involvingMe.length === 0 ? (
                            <p className="text-base text-muted-foreground">{t('groups.noSuggestions')}</p>
                        ) : (
                            <ul className="space-y-2">
                                {involvingMe.map((s) => (
                                    <li
                                        key={`${s.fromUserId}-${s.toUserId}-${s.amount}`}
                                        className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-base"
                                    >
                                        <span className="font-medium">
                                            {s.fromUserId === meId ? t('groups.you') : s.fromUserName}
                                        </span>
                                        <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                                        <span className="font-medium">
                                            {s.toUserId === meId ? t('groups.you') : s.toUserName}
                                        </span>
                                        <span className="ml-auto font-mono font-bold text-primary">{fmt(s.amount)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {direct.length === 0 ? (
                            <p className="text-base text-muted-foreground">{t('groups.noDirectDebt')}</p>
                        ) : (
                            <ul className="space-y-2">
                                {direct.map((s) => {
                                    const iOwe = s.fromUserId === meId
                                    return (
                                        <li
                                            key={`${s.fromUserId}-${s.toUserId}-${s.amount}`}
                                            className="rounded-lg border border-border px-4 py-3"
                                        >
                                            <p className="text-base font-medium">
                                                {iOwe
                                                    ? t('groups.youOweThem', { name: member.fullName })
                                                    : t('groups.theyOweYou', { name: member.fullName })}
                                            </p>
                                            <p className={`font-mono text-xl font-bold ${iOwe ? 'text-destructive' : 'text-primary'}`}>
                                                {fmt(s.amount)}
                                            </p>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                        <p className="flex items-center justify-between border-t border-border pt-3 text-base">
                            <span className="text-muted-foreground">
                                {t('groups.netBalance')} · {member.fullName}
                            </span>
                            <span className={`font-mono font-bold ${balanceTextClass(netOf(member.userId))}`}>
                                {fmt(netOf(member.userId))}
                            </span>
                        </p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
