import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'

/** Hiển thị + chép invite code (clipboard API, fallback toast khi bị chặn). */
export function InviteCodeBox({ code }: { code: string }) {
    const { t } = useTranslation()
    const [copied, setCopied] = useState(false)

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(code)
            setCopied(true)
            toast.success(t('groups.copied'))
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast.error(t('errors.UNKNOWN_ERROR'))
        }
    }

    return (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
            <div>
                <p className="text-sm text-muted-foreground">{t('groups.inviteCode')}</p>
                <p className="font-mono text-xl font-bold tracking-widest">{code}</p>
            </div>
            <Button variant="outline" onClick={() => void copy()} aria-live="polite">
                {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                {t('groups.copyInvite')}
            </Button>
        </div>
    )
}
