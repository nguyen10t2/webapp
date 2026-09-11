import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import type { Currency, SettlementSuggestion } from '@/domain/groups'
import { useRecordSettlement } from '@/features/settlements/api'
import { apiErrorMessage } from '@/features/auth/helpers'
import { formatMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'

/**
 * Gợi ý trả nợ tối thiểu + nút 1-click ghi nhận (không cần form).
 * Ghi xong invalidate summary/groups nên số dư cập nhật không F5.
 */
export function SuggestionsList({
    groupId,
    suggestions,
    currency,
}: {
    groupId: string
    suggestions: SettlementSuggestion[]
    currency: Currency
}) {
    const { t, i18n } = useTranslation()
    const record = useRecordSettlement(groupId)

    if (suggestions.length === 0) {
        return <p className="text-base text-muted-foreground">{t('groups.noSuggestions')}</p>
    }

    return (
        <ul className="space-y-3">
            {suggestions.map((s) => (
                <li
                    key={`${s.fromUserId}-${s.toUserId}-${s.amount}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
                >
                    <p className="flex min-w-0 flex-wrap items-center gap-2 text-base">
                        <span className="font-medium">{s.fromUserName}</span>
                        <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="font-medium">{s.toUserName}</span>
                        <span className="font-mono font-bold text-primary">
                            {formatMoney(s.amount, currency, i18n.language)}
                        </span>
                    </p>
                    <Button
                        size="sm"
                        disabled={record.isPending}
                        onClick={() => {
                            record.mutate(
                                {
                                    groupId,
                                    senderId: s.fromUserId,
                                    receiverId: s.toUserId,
                                    amount: s.amount,
                                    currency,
                                },
                                {
                                    onSuccess: () => toast.success(t('groups.recorded')),
                                    onError: (error) => toast.error(apiErrorMessage(t, error)),
                                },
                            )
                        }}
                    >
                        {record.isPending ? t('groups.recording') : t('groups.markPaid')}
                    </Button>
                </li>
            ))}
        </ul>
    )
}
