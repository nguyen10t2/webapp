import * as TabsPrimitive from '@radix-ui/react-tabs'
import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/cn'

/** Tabs shadcn-style trên Radix (keyboard nav có sẵn: arrows di chuyển). */
export function Tabs(props: ComponentProps<typeof TabsPrimitive.Root>) {
    return <TabsPrimitive.Root data-slot="tabs" {...props} />
}

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
    return (
        <TabsPrimitive.List
            data-slot="tabs-list"
            className={cn(
                'inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-muted p-1 text-muted-foreground',
                className,
            )}
            {...props}
        />
    )
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
    return (
        <TabsPrimitive.Trigger
            data-slot="tabs-trigger"
            className={cn(
                'inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-card data-[state=active]:text-card-foreground data-[state=active]:shadow-sm [&_svg]:size-4 [&_svg]:shrink-0',
                className,
            )}
            {...props}
        />
    )
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
    return (
        <TabsPrimitive.Content
            data-slot="tabs-content"
            className={cn('mt-4 outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}
            {...props}
        />
    )
}
