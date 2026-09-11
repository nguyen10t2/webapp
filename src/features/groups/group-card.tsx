import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Users } from 'lucide-react'
import type { Group } from '@/domain/groups'
import { balanceTextClass, formatMoney } from '@/shared/lib/money'
import { Card } from '@/shared/ui/field'

/** Card nhóm: tên, currency, số dư của mình màu ngữ nghĩa. Click → detail. */
export function GroupCard({ group }: { group: Group }) {
    const { i18n } = useTranslation()
    const balance = group.userBalance ?? 0
    return (
        <Link
            to={`/groups/${group.id}`}
            className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={group.name}
        >
            <Card className="group p-5 transition-all duration-200 hover:-translate-y-1 hover:border-ring hover:shadow-lift motion-reduce:hover:translate-y-0">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary-deep text-primary-foreground shadow-sm">
                            <Users className="size-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <p className="truncate text-lg font-semibold">{group.name}</p>
                            <p className="mt-0.5 text-sm text-muted-foreground">{group.defaultCurrency}</p>
                        </div>
                    </div>
                    <ArrowUpRight
                        className="size-5 shrink-0 text-muted-foreground transition-all duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
                        aria-hidden="true"
                    />
                </div>
                <p className={`mt-3 font-mono text-xl font-bold ${balanceTextClass(balance)}`}>
                    {formatMoney(balance, group.defaultCurrency, i18n.language)}
                </p>
                {group.description && <p className="mt-1 truncate text-sm text-muted-foreground">{group.description}</p>}
            </Card>
        </Link>
    )
}
