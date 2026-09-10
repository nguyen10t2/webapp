import type { HTMLAttributes, LabelHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

/** Card container: flat, border token, không shadow 3D (đúng Flat/Minimalism). */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('rounded-lg border border-border bg-card text-card-foreground', className)} {...props} />
}

interface FieldProps extends HTMLAttributes<HTMLDivElement> {
    label: string
    htmlFor: string
    /** Inline error — render dưới input, nối qua `aria-describedby` ở caller. */
    error?: string
    errorId?: string
    hint?: ReactNode
    children: ReactNode
}

/** Form field: label thật + input + hint/inline error (placeholder không thay label). */
export function Field({ label, htmlFor, error, errorId, hint, children, className, ...props }: FieldProps) {
    return (
        <div className={cn('space-y-2', className)} {...props}>
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
            {error ? (
                <p id={errorId} role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            ) : hint ? (
                <p className="text-sm text-muted-foreground">{hint}</p>
            ) : null}
        </div>
    )
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
    return <label className={cn('text-base font-medium text-foreground', className)} {...props} />
}
