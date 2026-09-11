import type { Currency } from '@/domain/groups/types'

/**
 * Format tiền theo locale. Amount là đơn vị nhỏ nhất (đồng cho VND, cent cho USD).
 * Dùng `Intl` thay vì tự nối chuỗi (dấu phân cách nghìn theo vi/en).
 */
export function formatMoney(amount: number, currency: Currency, locale: string = 'vi'): string {
    const tag = locale.startsWith('vi') ? 'vi-VN' : 'en-US'
    if (currency === 'VND') {
        return new Intl.NumberFormat(tag, { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount)
    }
    return new Intl.NumberFormat(tag, { style: 'currency', currency: 'USD' }).format(amount / 100)
}

/** Màu ngữ nghĩa số dư: dương (được nhận) xanh, âm (phải trả) đỏ, 0 muted. */
export function balanceTone(amount: number): 'positive' | 'negative' | 'zero' {
    if (amount > 0) return 'positive'
    if (amount < 0) return 'negative'
    return 'zero'
}

export function balanceTextClass(amount: number): string {
    switch (balanceTone(amount)) {
        case 'positive':
            return 'text-primary'
        case 'negative':
            return 'text-destructive'
        case 'zero':
            return 'text-muted-foreground'
    }
}
