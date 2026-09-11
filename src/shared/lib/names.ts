/**
 * Chữ cái đầu (tối đa 2 từ) làm avatar fallback. Pure — dùng chung member list,
 * group header, expense payer...
 */
export function initials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('')
}
