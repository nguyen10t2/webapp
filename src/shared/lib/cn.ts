import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Gộp class Tailwind có điều kiện, `tailwind-merge` khử xung đột
 * (vd `cn('px-4', cond && 'px-6')` → `'px-6'`).
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs))
}
