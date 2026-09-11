import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { Receipt } from 'lucide-react'
import type { Currency } from '@/domain/groups/types'
import { groupExpensesByMonth } from '@/domain/expenses'
import { fetchGroupExpensesPage } from '@/features/expenses/api'
import { useAuthStore } from '@/infrastructure/auth/auth-store'
import { queryKeys } from '@/infrastructure/query/keys'
import { apiErrorMessage } from '@/features/auth/helpers'
import { formatMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/field'
import { Skeleton } from '@/shared/ui/skeleton'

function monthLabel(year: number, month: number, locale: string): string {
    const tag = locale.startsWith('vi') ? 'vi-VN' : 'en-US'
    return new Intl.DateTimeFormat(tag, { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
}

function dayLabel(iso: string, locale: string): string {
    const tag = locale.startsWith('vi') ? 'vi-VN' : 'en-US'
    return new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'numeric' }).format(new Date(iso))
}

/**
 * Lịch sử chi tiêu group theo hóa đơn, group theo tháng (mới nhất trước).
 * Backend chỉ phân trang theo `expense_date` — load nhiều page (limit 100 của server
 * không đủ thì "Tải thêm") rồi group client-side. Parent render với `key={groupId}`
 * để đổi nhóm là reset page (không setState trong effect).
 */
export function ExpenseHistory({ groupId, currency }: { groupId: string; currency: Currency }) {
    const { t, i18n } = useTranslation()
    const status = useAuthStore((s) => s.status)
    const [pageCount, setPageCount] = useState(1)

    const pages = useQueries({
        queries: Array.from({ length: pageCount }, (_, i) => ({
            queryKey: queryKeys.groupExpenses(groupId, i + 1),
            queryFn: () => fetchGroupExpensesPage(groupId, i + 1),
            enabled: status === 'authenticated' && groupId.length > 0,
            staleTime: 15_000,
        })),
    })

    // Gộp trực tiếp mỗi render (list nhỏ, rẻ hơn memo + key hack) — không effect, không cascade render.
    const all = pages.flatMap((q) => q.data?.items ?? [])
    const firstError = pages.find((q) => q.isError)?.error
    const totalPages = pages[0]?.data?.meta.totalPages ?? 1
    const loading = pages.some((q) => q.isPending) && all.length === 0
    const fetchingMore = pages.some((q) => q.isFetching)

    if (loading) {
        return (
            <div className="space-y-3" aria-busy="true" aria-label="Loading">
                {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
            </div>
        )
    }

    if (firstError && all.length === 0) {
        return (
            <Card className="p-6">
                <p role="alert" className="text-base text-destructive">
                    {apiErrorMessage(t, firstError)}
                </p>
            </Card>
        )
    }

    if (all.length === 0) {
        return (
            <Card className="space-y-2 p-8 text-center">
                <Receipt className="mx-auto size-12 text-primary/30" aria-hidden="true" />
                <p className="text-base text-muted-foreground">{t('expenses.emptyExpenses')}</p>
            </Card>
        )
    }

    const sections = groupExpensesByMonth(all)
    return (
        <div className="space-y-6">
            {sections.map((section) => (
                <section key={section.key} aria-label={monthLabel(section.year, section.month, i18n.language)}>
                    <div className="sticky top-0 z-10 -mx-1 bg-background/95 px-1 py-2 backdrop-blur">
                        <div className="flex items-baseline justify-between">
                            <h3 className="text-lg font-semibold capitalize">
                                {monthLabel(section.year, section.month, i18n.language)}
                            </h3>
                            <p className="font-mono text-base font-bold">
                                {formatMoney(section.total, currency, i18n.language)}
                            </p>
                        </div>
                    </div>
                    <ul className="space-y-2">
                        {section.items.map((expense) => (
                            <li key={expense.id}>
                                <Link
                                    to={`/groups/${groupId}/expenses/${expense.id}`}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 outline-none transition-all duration-150 hover:-translate-y-0.5 hover:border-ring hover:shadow-lift focus-visible:ring-2 focus-visible:ring-ring motion-reduce:hover:translate-y-0"
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate text-base font-medium">{expense.description}</span>
                                        <span className="block text-sm text-muted-foreground">
                                            {dayLabel(expense.expenseDate, i18n.language)}
                                            {expense.payerName ? ` · ${expense.payerName} ${t('expenses.paidBy')}` : ''}
                                        </span>
                                    </span>
                                    <span className="shrink-0 font-mono text-base font-bold">
                                        {formatMoney(expense.amount, expense.currency, i18n.language)}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
            {pageCount < totalPages && (
                <Button variant="outline" disabled={fetchingMore} onClick={() => setPageCount((p) => p + 1)} className="w-full">
                    {t('expenses.loadMore')}
                </Button>
            )}
        </div>
    )
}
