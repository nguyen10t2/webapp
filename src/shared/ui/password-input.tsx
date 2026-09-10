import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import type { InputHTMLAttributes } from 'react'

/**
 * Password input có toggle hiện/ẩn (khuyến nghị ui-ux-pro-max: password visibility),
 * cho paste + autocomplete để tương thích password manager (WCAG 2.2 AA).
 * Mặc định `current-password`; form tạo/đặt mật khẩu mới truyền `autoComplete="new-password"`.
 */
export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
    const { t } = useTranslation()
    const [visible, setVisible] = useState(false)
    return (
        <div className="relative">
            <Input autoComplete="current-password" {...props} type={visible ? 'text' : 'password'} className="pr-12" />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
                aria-pressed={visible}
                className="absolute top-1/2 right-1 size-8 -translate-y-1/2"
            >
                {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </Button>
        </div>
    )
}
