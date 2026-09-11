import { useTranslation } from 'react-i18next'
import { Scale } from 'lucide-react'
import type { Group } from '@/domain/groups'
import { balanceTextClass, formatMoney } from '@/shared/lib/money'
import { Card } from '@/shared/ui/field'

/**
 * Vị thế ròng: cộng dồn `userBalance` mọi nhóm. Không lưu derived state —
 * tính trực tiếp từ Query data (file 03-state-management).
 */
export function NetPositionCard({ groups }: { groups: Group[] }) {
    const { t, i18n } = useTranslation()
    const total = groups.reduce((sum, g) => sum + (g.userBalance ?? 0), 0)
    // Hiển thị theo VND (đa số nhóm) — M3+ xử lý đa tiền tệ khi có expense nhiều currency.
    return (
        <Card className="relative overflow-hidden p-6">
            <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-transparent" aria-hidden="true" />
            <div className="relative flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-deep text-primary-foreground shadow-sm">
                    <Scale className="size-5" aria-hidden="true" />
                </span>
                <div>
                    <p className="text-base text-muted-foreground">{t('groups.netTitle')}</p>
                    <p className={`font-mono text-3xl font-bold ${balanceTextClass(total)}`}>
                        {formatMoney(total, 'VND', i18n.language)}
                    </p>
                </div>
            </div>
            <p className="relative mt-2 text-sm text-muted-foreground">
                {total > 0 ? t('groups.toReceive') : total < 0 ? t('groups.toPay') : t('groups.balanced')}
            </p>
        </Card>
    )
}
