import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import type { GroupMember } from '@/domain/groups'
import type { Currency } from '@/domain/groups/types'
import { createExpenseSchema } from '@/domain/expenses'
import { useCreateExpense } from '@/features/expenses/api'
import { apiErrorMessage } from '@/features/auth/helpers'
import { equalShares, percentageAmounts, percentToUnits } from '@/features/expenses/split-math'
import { SplitEditor, type SplitDraft } from '@/features/expenses/split-editor'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { initials } from '@/shared/lib/names'

type Step = 'info' | 'members' | 'split'

function todayInput(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/**
 * Wizard tạo expense 3 bước: thông tin → người tham gia → chia tiền.
 * Validate zod đúng luật backend trước khi POST (tránh 400 tốn round-trip).
 * `onDone` để caller đóng popup; không truyền thì navigate về trang nhóm (dùng ở route).
 */
export function ExpenseWizard({
    groupId,
    members,
    defaultCurrency,
    myId,
    onDone,
}: {
    groupId: string
    members: GroupMember[]
    defaultCurrency: Currency
    myId: string | undefined
    onDone?: () => void
}) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const createExpense = useCreateExpense(groupId)
    const [step, setStep] = useState<Step>('info')

    const [amount, setAmount] = useState('')
    // Currency khóa cứng theo nhóm (không cho chọn — backend tính công nợ theo currency của expense).
    const currency = defaultCurrency
    const [description, setDescription] = useState('')
    const [expenseDate, setExpenseDate] = useState(todayInput)
    const [payerId, setPayerId] = useState(myId && members.some((m) => m.userId === myId) ? myId : (members[0]?.userId ?? ''))
    const [participantIds, setParticipantIds] = useState<string[]>(members.map((m) => m.userId))
    const [split, setSplit] = useState<SplitDraft>({ splitType: 'EQUAL', entries: {} })
    const [formError, setFormError] = useState<string | null>(null)

    const participants = members.filter((m) => participantIds.includes(m.userId))
    const total = Number(amount) || 0

    /** Split hiện tại đã khớp chưa — chưa khớp thì ẩn/khóa nút Lưu (tránh POST lỗi). */
    const splitValid = (() => {
        const ids = participants.map((m) => m.userId)
        if (split.splitType === 'EQUAL') return true
        if (split.splitType === 'EXACT') {
            return ids.reduce((sum, id) => sum + (Number(split.entries[id]) || 0), 0) === total
        }
        let units = 0
        for (const id of ids) {
            const u = percentToUnits(split.entries[id] ?? '')
            if (u === null) return false
            units += u
        }
        return units === 10000
    })()

    const toggleParticipant = (id: string) =>
        setParticipantIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))

    const submit = () => {
        if (participants.length === 0) {
            setFormError(t('expenses.participants'))
            return
        }
        const ids = participants.map((m) => m.userId)
        const shares =
            split.splitType === 'EQUAL'
                ? equalShares(total, ids).map((s) => ({ userId: s.userId, shareAmount: s.shareAmount }))
                : split.splitType === 'EXACT'
                  ? ids.map((id) => ({ userId: id, shareAmount: Number(split.entries[id]) || 0 }))
                  : (() => {
                        const units: Record<string, number> = {}
                        for (const id of ids) {
                            const u = percentToUnits(split.entries[id] ?? '')
                            if (u === null) return null
                            units[id] = u
                        }
                        const amounts = percentageAmounts(total, units, ids)
                        return ids.map((id) => ({
                            userId: id,
                            shareAmount: amounts[id] ?? 0,
                            sharePercentage: units[id],
                        }))
                    })()
        if (shares === null) {
            setFormError(t('errors.SPLIT_PERCENTAGE_MISMATCH'))
            return
        }
        const parsed = createExpenseSchema.safeParse({
            groupId,
            payerId,
            amount: total,
            currency,
            description: description.trim(),
            expenseDate,
            splitType: split.splitType,
            shares,
        })
        if (!parsed.success) {
            const key = parsed.error.issues[0]?.message ?? 'VALIDATION_ERROR'
            setFormError(t([`errors.${key}`, 'errors.VALIDATION_ERROR']))
            return
        }
        setFormError(null)
        createExpense.mutate(parsed.data, {
            onSuccess: () => {
                toast.success(t('expenses.createSuccess'))
                if (onDone) onDone()
                else navigate(`/groups/${groupId}`, { replace: true })
            },
            onError: (error) => toast.error(apiErrorMessage(t, error)),
        })
    }

    return (
        <div className="space-y-4">
            <p className="text-base text-muted-foreground">
                {step === 'info' ? t('expenses.stepInfo') : step === 'members' ? t('expenses.stepMembers') : t('expenses.stepSplit')}
            </p>

            {step === 'info' && (
                <div className="space-y-4">
                    <Field label={currency === 'VND' ? t('expenses.amountVND') : t('expenses.amountUSD')} htmlFor="exp-amount">
                        <div className="flex gap-2">
                            <Input
                                id="exp-amount"
                                inputMode="numeric"
                                placeholder="100000"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                                className="font-mono"
                            />
                            <span
                                aria-hidden="true"
                                className="flex shrink-0 items-center rounded-md border border-border bg-muted px-4 font-mono text-base text-muted-foreground"
                            >
                                {currency}
                            </span>
                        </div>
                    </Field>
                    <Field label={t('expenses.description')} htmlFor="exp-desc">
                        <Input
                            id="exp-desc"
                            placeholder={t('expenses.descriptionPlaceholder')}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={255}
                        />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label={t('expenses.expenseDate')} htmlFor="exp-date">
                            <Input id="exp-date" type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
                        </Field>
                    </div>
                    <Field label={t('expenses.payer')} htmlFor="exp-payer">
                        <ul className="space-y-2" id="exp-payer">
                            {members.map((m) => (
                                <li key={m.userId}>
                                    <label
                                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2 transition-colors ${
                                            payerId === m.userId ? 'border-ring bg-muted' : 'border-border'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="payer"
                                            checked={payerId === m.userId}
                                            onChange={() => setPayerId(m.userId)}
                                            className="accent-primary"
                                        />
                                        <Avatar className="size-7" aria-hidden="true">
                                            <AvatarFallback className="text-xs">{initials(m.fullName)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-base">{m.fullName}</span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </Field>
                    <Button
                        disabled={total < 1 || description.trim().length === 0 || payerId === ''}
                        onClick={() => setStep('members')}
                        className="w-full"
                    >
                        {t('expenses.next')}
                    </Button>
                </div>
            )}

            {step === 'members' && (
                <div className="space-y-4">
                    <Field label={t('expenses.participants')} htmlFor="exp-members">
                        <ul className="space-y-2" id="exp-members">
                            {members.map((m) => {
                                const checked = participantIds.includes(m.userId)
                                return (
                                    <li key={m.userId}>
                                        <label
                                            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2 transition-colors ${
                                                checked ? 'border-ring bg-muted' : 'border-border'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleParticipant(m.userId)}
                                                className="size-4 accent-primary"
                                            />
                                            <Avatar className="size-7" aria-hidden="true">
                                                <AvatarFallback className="text-xs">{initials(m.fullName)}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-base">{m.fullName}</span>
                                        </label>
                                    </li>
                                )
                            })}
                        </ul>
                    </Field>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setStep('info')} className="flex-1">
                            {t('expenses.back')}
                        </Button>
                        <Button disabled={participantIds.length === 0} onClick={() => setStep('split')} className="flex-1">
                            {t('expenses.next')}
                        </Button>
                    </div>
                </div>
            )}

            {step === 'split' && (
                <div className="space-y-4">
                    <SplitEditor amount={total} currency={currency} participants={participants} draft={split} onChange={setSplit} />
                    {formError && (
                        <p role="alert" className="text-base font-medium text-destructive">
                            {formError}
                        </p>
                    )}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setStep('members')} className="flex-1">
                            {t('expenses.back')}
                        </Button>
                        <Button disabled={createExpense.isPending || !splitValid} onClick={submit} className="flex-1">
                            {createExpense.isPending ? t('expenses.saving') : t('expenses.saveExpense')}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
