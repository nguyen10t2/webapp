import { cva } from 'class-variance-authority'

/**
 * Variants của Button (tách file riêng để thỏa `react/only-export-components`:
 * file component chỉ export component).
 */
export const buttonVariants = cva(
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-md text-base font-medium whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:size-5 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                default:
                    'bg-linear-to-b from-primary to-primary-deep text-primary-foreground shadow-sm hover:shadow-lift hover:brightness-105 active:brightness-95',
                secondary: 'bg-secondary text-secondary-foreground hover:opacity-90',
                destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
                outline: 'border border-border bg-card text-card-foreground hover:bg-muted',
                ghost: 'text-foreground hover:bg-muted',
                link: 'text-primary underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-11 px-5',
                sm: 'h-9 px-4 text-sm [&_svg]:size-4',
                lg: 'h-12 px-6 text-lg',
                icon: 'size-11',
            },
        },
        defaultVariants: { variant: 'default', size: 'default' },
    },
)
