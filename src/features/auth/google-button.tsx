import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'

function GoogleMark() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0">
            <path
                fill="#4285F4"
                d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81z"
            />
            <path
                fill="#34A853"
                d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24z"
            />
            <path
                fill="#FBBC05"
                d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.29a12 12 0 0 0 0 10.76l3.98-3.1z"
            />
            <path
                fill="#EA4335"
                d="M12 4.76c1.76 0 3.3.6 4.53 1.79l3.4-3.4A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.1C6.22 6.87 8.87 4.76 12 4.76z"
            />
        </svg>
    )
}

/**
 * Nút Google luôn hiển thị nhưng CHƯA khả dụng (phase 1): nhấn → toast
 * "sắp được hỗ trợ". OAuth full (`/api/users/auth/google`) để milestone sau.
 */
export function GoogleButton() {
    const { t } = useTranslation()
    return (
        <Button
            type="button"
            variant="outline"
            onClick={() => toast.info(t('auth.googleSoon'))}
            aria-describedby="google-soon-note"
            className="w-full"
        >
            <GoogleMark />
            {t('auth.continueWithGoogle')}
        </Button>
    )
}
