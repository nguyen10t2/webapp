import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useMe } from '@/features/auth/api'
import { useGroup, useGroupMembers } from '@/features/groups/api'
import { ExpenseWizard } from '@/features/expenses/expense-wizard'
import { apiErrorMessage } from '@/features/auth/helpers'
import { Card } from '@/shared/ui/field'
import { Skeleton } from '@/shared/ui/skeleton'

/** Trang tạo expense: cần members (picker payer/participants) + currency mặc định. */
export function NewExpensePage() {
    const { t } = useTranslation()
    const { id = '' } = useParams()
    const me = useMe()
    const group = useGroup(id)
    const members = useGroupMembers(id)

    const loading = group.isPending || members.isPending
    const failed = group.isError || members.isError

    return (
        <main className="mx-auto w-full max-w-2xl space-y-6 p-4">
            <div>
                <Link
                    to={`/groups/${id}`}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    {t('expenses.title')}
                </Link>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">{t('expenses.newExpense')}</h1>
                {group.data && <p className="mt-1 text-base text-muted-foreground">{group.data.name}</p>}
            </div>
            {loading ? (
                <div className="space-y-3" aria-busy="true" aria-label="Loading">
                    <Skeleton className="h-12 rounded-lg" />
                    <Skeleton className="h-12 rounded-lg" />
                    <Skeleton className="h-12 rounded-lg" />
                </div>
            ) : failed ? (
                <Card className="p-6">
                    <p role="alert" className="text-base text-destructive">
                        {group.isError ? apiErrorMessage(t, group.error) : t('errors.UNKNOWN_ERROR')}
                    </p>
                </Card>
            ) : (
                <Card className="p-6">
                    <ExpenseWizard
                        groupId={id}
                        members={members.data ?? []}
                        defaultCurrency={group.data?.defaultCurrency ?? 'VND'}
                        myId={me.data?.id}
                    />
                </Card>
            )}
        </main>
    )
}
