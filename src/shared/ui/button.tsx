import { Slot } from '@radix-ui/react-slot'
import type { VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'
import { buttonVariants } from '@/shared/ui/button-variants'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    /** Render như child (Slot) thay vì `<button>` — dùng cho link styled-button. */
    asChild?: boolean
}

/** Button shadcn-style: variants qua `cva`, màu từ `@theme` tokens, touch target ≥36px (icon 44px khi thêm padding hit-area ở caller). */
export function Button({ className, variant, size, asChild = false, type = 'button', ...props }: ButtonProps) {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size }), className)} type={asChild ? undefined : type} {...props} />
}
