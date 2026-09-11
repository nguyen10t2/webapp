import { useTranslation } from 'react-i18next'
import type { GroupMember } from '@/domain/groups'
import type { Currency, SplitType } from '@/domain/groups/types'
import { formatMoney } from '@/shared/lib/money'
import { equalShares, percentageAmounts, percentToUnits } from '@/features/expenses/split-math'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'

export interface SplitDraft {
    splitType: SplitType
    /** EXACT: số tiền thô từng người. PERCENTAGE: chuỗi % ("33.33"). */
    entries: Record<string, string>
}

interface SplitEditorProps {
    amount: number
    currency: Currency
    participants: GroupMember[]
    draft: SplitDraft
    onChange: (draft: SplitDraft) => void
}

const SPLIT_TABS: SplitType[] = ['EQUAL', 'EXACT', 'PERCENTAGE']

/**
 * Editor chia tiền theo 3 modes. EQUAL auto-rải (read-only preview),
 * EXACT/PERCENTAGE nhập tay + live diff/tổng. Không submit ở đây —
 * wizard cha build input + validate zod.
 */
export function SplitEditor({ amount, currency, participants, draft, onChange }: SplitEditorProps) {
    const { t, i18n } = useTranslation()
    const ids = participants.map((m) => m.userId)
    const nameOf = (id: string) => participants.find((m) => m.userId === id)?.fullName ?? id

    const setEntry = (id: string, value: string) =>
        onChange({ ...draft, entries: { ...draft.entries, [id]: value } })

    return (
        <div className="space-y-4">
            <div className="flex gap-2" role="group" aria-label={t('expenses.splitType')}>
                {SPLIT_TABS.map((mode) => (
                    <Button
                        key={mode}
                        type="button"
                        variant={draft.splitType === mode ? 'secondary' : 'outline'}
                        onClick={() => onChange({ splitType: mode, entries: {} })}
                        aria-pressed={draft.splitType === mode}
                        className="flex-1"
                    >
                        {t(`expenses.split${mode}`)}
                    </Button>
                ))}
            </div>

            {draft.splitType === 'EQUAL' && (
                <ul className="space-y-2">
                    {equalShares(amount, ids).map((s) => (
                        <li
                            key={s.userId}
                            className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2 text-base"
                        >
                            <span>{nameOf(s.userId)}</span>
                            <span className="font-mono font-bold">{formatMoney(s.shareAmount, currency, i18n.language)}</span>
                        </li>
                    ))}
                </ul>
            )}

            {draft.splitType === 'EXACT' && (
                <div className="space-y-4">
                    {participants.map((m) => (
                        <Field key={m.userId} label={m.fullName} htmlFor={`exact-${m.userId}`}>
                            <Input
                                id={`exact-${m.userId}`}
                                inputMode="numeric"
                                placeholder="0"
                                value={draft.entries[m.userId] ?? ''}
                                onChange={(e) => setEntry(m.userId, e.target.value.replace(/[^0-9]/g, ''))}
                            />
                        </Field>
                    ))}
                    <ExactDiff amount={amount} currency={currency} entries={draft.entries} ids={ids} />
                </div>
            )}

            {draft.splitType === 'PERCENTAGE' && (
                <div className="space-y-4">
                    {participants.map((m) => {
                        const units = percentToUnits(draft.entries[m.userId] ?? '')
                        const preview =
                            units === null
                                ? null
                                : (percentageAmounts(amount, { [m.userId]: units }, [m.userId])[m.userId] ?? 0)
                        return (
                            <Field key={m.userId} label={m.fullName} htmlFor={`pct-${m.userId}`}>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id={`pct-${m.userId}`}
                                        inputMode="decimal"
                                        placeholder="0"
                                        value={draft.entries[m.userId] ?? ''}
                                        onChange={(e) => setEntry(m.userId, e.target.value.replace(/[^0-9.,]/g, ''))}
                                    />
                                    <span className="w-24 shrink-0 text-right font-mono text-sm text-muted-foreground">
                                        {preview === null
                                            ? '—'
                                            : formatMoney(preview, currency, i18n.language)}
                                    </span>
                                </div>
                            </Field>
                        )
                    })}
                    <PercentageTotal entries={draft.entries} ids={ids} />
                </div>
            )}
        </div>
    )
}

/** Live diff EXACT: còn thiếu/thừa bao nhiêu so với tổng. */
function ExactDiff({
    amount,
    currency,
    entries,
    ids,
}: {
    amount: number
    currency: Currency
    entries: Record<string, string>
    ids: string[]
}) {
    const { t, i18n } = useTranslation()
    const sum = ids.reduce((s, id) => s + (Number(entries[id]) || 0), 0)
    const diff = amount - sum
    return (
        <p role="status" className={`text-base font-medium ${diff === 0 ? 'text-primary' : 'text-destructive'}`}>
            {diff === 0
                ? t('expenses.exactBalanced')
                : t('expenses.exactRemaining', { amount: formatMoney(diff, currency, i18n.language) })}
        </p>
    )
}

/** Live tổng % (đơn vị hiển thị, mục tiêu 100%). */
function PercentageTotal({ entries, ids }: { entries: Record<string, string>; ids: string[] }) {
    const { t } = useTranslation()
    const totalUnits = ids.reduce((s, id) => s + (percentToUnits(entries[id] ?? '') ?? 0), 0)
    const ok = totalUnits === 10000
    return (
        <p role="status" className={`text-base font-medium ${ok ? 'text-primary' : 'text-destructive'}`}>
            {t('expenses.percentageTotal', { value: (totalUnits / 100).toString() })}
        </p>
    )
}
