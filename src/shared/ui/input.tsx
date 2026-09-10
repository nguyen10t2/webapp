import type { InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

/** Input shadcn-style: màu từ `@theme` tokens, focus ring rõ cho keyboard nav. */
export function Input({ className, type = 'text', ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            type={type}
            className={cn(
                'h-11 w-full rounded-md border border-border bg-card px-4 py-2 text-base text-card-foreground shadow-none transition-colors duration-150 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive',
                className,
            )}
            {...props}
        />
    )
}
