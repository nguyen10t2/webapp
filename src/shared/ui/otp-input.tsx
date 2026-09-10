import { useRef } from 'react'
import { cn } from '@/shared/lib/cn'

interface OtpInputProps {
    id: string
    value: string
    onChange: (value: string) => void
    invalid?: boolean
    describedBy?: string
}

/**
 * OTP 6 ô: chỉ nhận số, tự nhảy ô, Backspace lùi ô, hỗ trợ paste cả dãy
 * (paste bị chặn là anti-pattern a11y theo ui-ux-pro-max).
 */
export function OtpInput({ id, value, onChange, invalid = false, describedBy }: OtpInputProps) {
    const refs = useRef<Array<HTMLInputElement | null>>([])
    const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '')

    const setDigit = (index: number, char: string) => {
        const next = value.split('')
        next[index] = char
        onChange(next.join('').slice(0, 6))
    }

    return (
        <div className="flex gap-3" role="group" aria-label="OTP">
            {digits.map((digit, index) => (
                <input
                    // oxlint-disable-next-line no-array-index-key — thứ tự ô OTP cố định, không reorder.
                    key={`${id}-${index}`}
                    ref={(el) => {
                        refs.current[index] = el
                    }}
                    id={index === 0 ? id : undefined}
                    value={digit}
                    inputMode="numeric"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    aria-label={`Digit ${index + 1}`}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    maxLength={1}
                    onChange={(e) => {
                        const char = e.target.value.replace(/\D/g, '').slice(-1)
                        if (!char) return
                        setDigit(index, char)
                        refs.current[Math.min(index + 1, 5)]?.focus()
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !digit && index > 0) {
                            e.preventDefault()
                            setDigit(index - 1, '')
                            refs.current[index - 1]?.focus()
                        }
                    }}
                    onPaste={(e) => {
                        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
                        if (pasted) {
                            e.preventDefault()
                            onChange(pasted)
                            refs.current[Math.min(pasted.length, 5)]?.focus()
                        }
                    }}
                    className={cn(
                        'h-14 w-full rounded-md border bg-card text-center font-mono text-xl text-card-foreground outline-none transition-colors duration-150 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
                        invalid ? 'border-destructive' : 'border-border',
                    )}
                />
            ))}
        </div>
    )
}
