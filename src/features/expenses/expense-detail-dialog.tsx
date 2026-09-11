import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { canDeleteExpense } from '@/domain/expenses'
import { useDeleteExpense, useExpense } from '@/features/expenses/api'
import { apiErrorMessage } from '@/features/auth/helpers'
import { formatMoney } from '@/shared/lib/money'
import { initials } from '@/shared/lib/names'
import { Button } from '@/shared/ui/button'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Skeleton } from '@/shared/ui/skeleton'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/ui/dialog'

/**
 * Popup chi tiết hóa đơn: payer, splits từng người, xóa 2-bước (creator/admin).
 * Mở ngay trên lịch sử, không chuyển page. Đóng là unmount → state sạch.
 */
export function ExpenseDetailDialog({
    expenseId,
    groupId,
    meId,
    admin,
    trigger,
}: {
    expenseId: string
    groupId: string
    meId: string | undefined
    admin: boolean
    trigger: React.ReactNode
}) {
    const { t, i18n } = useTranslation()
    const [open, setOpen] = useState(false)
    const [confirming, setConfirming] = useState(false)
    const expense = useExpense(open ? expenseId : '')
    const remove = useDeleteExpense(groupId)

    const dateFmt = (iso: string) =>
        new Intl.DateTimeFormat(i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(new Date(iso))

    const data = expense.data ?? null
    const deletable = data !== null && canDeleteExpense(data, meId, admin)
    const locale = i18n.language

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next)
                if (!next) setConfirming(false)
            }}
        >
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent aria-describedby="expense-detail-desc" className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                {expense.isPending ? (
                    <div className="space-y-3" aria-busy="true" aria-label="Loading">
                        <Skeleton className="h-8 w-2/3 rounded-lg" />
                        <Skeleton className="h-12 rounded-lg" />
                        <Skeleton className="h-12 rounded-lg" />
                    </div>
                ) : expense.isError || !data ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>{t('expenses.title')}</DialogTitle>
                        </DialogHeader>
                        <p role="alert" className="text-base text-destructive">
                            {expense.isError ? apiErrorMessage(t, expense.error) : ''}
                        </p>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-2xl">{data.description}</DialogTitle>
                            <DialogDescription id="expense-detail-desc">
                                {formatMoney(data.amount, data.currency, locale)} ·{' '}
                                {(data.payerName ?? t('expenses.payer'))} {t('expenses.paidBy')} · {dateFmt(data.expenseDate)} ·{' '}
                                {t(`expenses.split${data.splitType}`)}
                            </DialogDescription>
                        </DialogHeader>
                        <ul className="space-y-2">
                            {(data.shares ?? []).map((s) => {
                                const name = s.userName ?? s.userId.slice(0, 8)
                                return (
                                    <li
                                        key={s.id}
                                        className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-2"
                                    >
                                        <span className="flex min-w-0 items-center gap-3">
                                            <Avatar className="size-7" aria-hidden="true">
                                                <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
                                            </Avatar>
                                            <span className="truncate text-base font-medium">{name}</span>
                                        </span>
                                        <span className="shrink-0 font-mono font-bold">
                                            {formatMoney(s.shareAmount, data.currency, locale)}
                                        </span>
                                    </li>
                                )
                            })}
                        </ul>
                        {deletable &&
                            (confirming ? (
                                <div className="space-y-3 rounded-lg border border-destructive/50 p-4">
                                    <p className="text-base font-medium">{t('expenses.deleteConfirm')}</p>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => setConfirming(false)} className="flex-1">
                                            {t('expenses.cancel')}
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            disabled={remove.isPending}
                                            onClick={() => {
                                                remove.mutate(expenseId, {
                                                    onSuccess: () => {
                                                        toast.success(t('expenses.deleted'))
                                                        setOpen(false)
                                                    },
                                                    onError: (error) => toast.error(apiErrorMessage(t, error)),
                                                })
                                            }}
                                            className="flex-1"
                                        >
                                            {remove.isPending ? t('expenses.deleting') : t('expenses.delete')}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button variant="outline" onClick={() => setConfirming(true)} className="text-destructive">
                                    <Trash2 aria-hidden="true" />
                                    {t('expenses.deleteExpense')}
                                </Button>
                            ))}
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
