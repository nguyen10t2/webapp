/**
 * Toán chia tiền (pure, mirror backend `domain/expenses/strategy.rs`).
 * - EQUAL: mỗi share ∈ {floor(total/n), +1}, phần dư rải 1 đơn vị/share đầu.
 * - PERCENTAGE: đơn vị % × 100 (10000 = 100%), quy ra tiền bằng largest-remainder.
 */

/** Rải đều: tổng luôn đúng, mỗi share lệch nhau tối đa 1 (vd 100/3 → 34/33/33). */
export function equalShares(total: number, userIds: string[]): Array<{ userId: string; shareAmount: number }> {
    const n = userIds.length
    if (n === 0 || total < 0) return []
    const base = Math.floor(total / n)
    const remainder = total - base * n
    return userIds.map((userId, i) => ({ userId, shareAmount: base + (i < remainder ? 1 : 0) }))
}

/** Parse "33.33" (%) → 3333 units. Trả null khi không phải số. */
export function percentToUnits(raw: string): number | null {
    const trimmed = raw.trim().replace(',', '.')
    if (trimmed === '') return null
    const value = Number(trimmed)
    if (!Number.isFinite(value) || value < 0 || value > 100) return null
    return Math.round(value * 100)
}

/** Units (×100) → chuỗi % hiển thị ("33.33"). */
export function unitsToPercent(units: number): string {
    return (units / 100).toString()
}

/**
 * Quy % ra số tiền từng người (largest-remainder để Σ khớp total khi Σ units = 10000).
 * Gọi sau khi zod đã pass (Σ units đúng) — gọi sớm hơn vẫn an toàn, chỉ lệch hiển thị.
 */
export function percentageAmounts(
    total: number,
    unitsByUser: Record<string, number>,
    userIds: string[],
): Record<string, number> {
    const rows = userIds.map((id) => {
        const exact = (total * (unitsByUser[id] ?? 0)) / 10000
        return { id, exact, alloc: Math.floor(exact) }
    })
    let diff = total - rows.reduce((sum, r) => sum + r.alloc, 0)
    const order = [...rows].sort((a, b) => b.exact - b.alloc - (a.exact - a.alloc))
    for (const row of order) {
        if (diff <= 0) break
        row.alloc += 1
        diff -= 1
    }
    return Object.fromEntries(rows.map((r) => [r.id, r.alloc]))
}
