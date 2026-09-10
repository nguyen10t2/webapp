/** User tối thiểu client cần (đủ cho header/menu + phân quyền UI). */
export interface AuthUser {
    id: string
    fullName: string
    email: string
    phone: string | null
    preferredCurrency: 'USD' | 'VND'
}
