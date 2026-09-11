import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { canDeleteExpense } from '@/domain/expenses'
import { useDeleteExpense, useExpense } from '@/features/expenses/api'
import { useGroupMembers } from '@/features/groups/api'
import { useMe } from '@/features/auth/api'
import { isGroupAdmin } from '@/domain/groups'
import { apiErrorMessage } from '@/features/auth/helpers'
import { formatMoney } from '@/shared/lib/money'
import { initials } from '@/shared/lib/names'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/field'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Skeleton } from '@/shared/ui/skeleton'

/** Chi tiết hóa đơn: payer, splits từng người, xóa (creator/admin, confirm 2 bước). */
export function ExpenseDetailPage() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const { gid = '', id = '' } = useParams()
    const [confirming, setConfirming] = useState(false)

    const me = useMe()
    const expense = useExpense(id)
    const members = useGroupMembers(gid)
    const remove = useDeleteExpense(gid)

    const myRole = members.data?.find((m) => m.userId === me.data?.id)?.role
    const nameOf = (userId: string) =>
        members.data?.find((m) => m.userId === userId)?.fullName ?? userId.slice(0, 8)

    if (expense.isPending) {
        return (
            <main className="mx-auto w-full max-w-3xl space-y-4 p-4" aria-busy="true" aria-label="Loading">
                <Skeleton className="h-10 w-40 rounded-lg" />
                <Skeleton className="h-48 rounded-lg" />
            </main>
        )
    }

    if (expense.isError) {
        return (
            <main className="mx-auto w-full max-w-3xl p-4">
                <Card className="p-6">
                    <p role="alert" className="text-base text-destructive">
                        {apiErrorMessage(t, expense.error)}
                    </p>
                    <Link
                        to={`/groups/${gid}`}
                        className="mt-4 inline-block text-primary underline-offset-4 hover:underline"
                    >
                        {t('groups.backToGroups')}
                    </Link>
                </Card>
            </main>
        )
    }

    const data = expense.data
    const deletable = canDeleteExpense(data, me.data?.id, isGroupAdmin(myRole))

    return (
        <main className="mx-auto w-full max-w-3xl space-y-6 p-4">
            <div>
                <Link
                    to={`/groups/${gid}`}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    {t('expenses.title')}
                </Link>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">{data.description}</h1>
                <p className="mt-1 font-mono text-2xl font-bold text-primary">
                    {formatMoney(data.amount, data.currency, i18n.language)}
                </p>
                <p className="mt-1 text-base text-muted-foreground">
                    {(data.payerName ?? nameOf(data.payerId))} {t('expenses.paidBy')} ·{' '}
                    {new Intl.DateTimeFormat(i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    }).format(new Date(data.expenseDate))}{' '}
                    · {t(`expenses.split${data.splitType}`)}
                </p>
            </div>

            <section aria-label={t('expenses.participants')}>
                <h2 className="mb-3 text-xl font-semibold">{t('expenses.participants')}</h2>
                <Card className="overflow-hidden p-0">
                    <table className="w-full text-base">
                        <tbody>
                            {(data.shares ?? []).map((s) => (
                                <tr key={s.id} className="border-b border-border last:border-0">
                                    <td className="px-4 py-3 sm:px-6">
                                        <span className="flex items-center gap-3">
                                            <Avatar className="size-8" aria-hidden="true">
                                                <AvatarFallback className="text-xs">
                                                    {initials(s.userName ?? nameOf(s.userId))}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{s.userName ?? nameOf(s.userId)}</span>
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold sm:px-6">
                                        {formatMoney(s.shareAmount, data.currency, i18n.language)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </section>

            {deletable &&
                (confirming ? (
                    <Card className="space-y-3 border-destructive/50 p-4">
                        <p className="text-base font-medium">{t('expenses.deleteConfirm')}</p>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setConfirming(false)} className="flex-1">
                                {t('expenses.cancel')}
                            </Button>
                            <Button
                                variant="destructive"
                                disabled={remove.isPending}
                                onClick={() => {
                                    remove.mutate(id, {
                                        onSuccess: () => {
                                            toast.success(t('expenses.deleted'))
                                            navigate(`/groups/${gid}`, { replace: true })
                                        },
                                        onError: (error) => toast.error(apiErrorMessage(t, error)),
                                    })
                                }}
                                className="flex-1"
                            >
                                {remove.isPending ? t('expenses.deleting') : t('expenses.delete')}
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <Button variant="outline" onClick={() => setConfirming(true)} className="text-destructive">
                        <Trash2 aria-hidden="true" />
                        {t('expenses.deleteExpense')}
                    </Button>
                ))}
        </main>
    )
}
