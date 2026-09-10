import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '@/shared/i18n/en.json'
import vi from '@/shared/i18n/vi.json'

const STORAGE_KEY = 'sd-locale'

function detectLocale(): string {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved === 'vi' || saved === 'en') return saved
    } catch {
        // localStorage không khả dụng — dùng fallback.
    }
    return navigator.language.toLowerCase().startsWith('vi') ? 'vi' : 'en'
}

/** i18n instance duy nhất. Key lỗi = error `code` backend (ổn định), không dùng message thô. */
void i18n.use(initReactI18next).init({
    resources: { vi: { translation: vi }, en: { translation: en } },
    lng: detectLocale(),
    fallbackLng: 'vi',
    interpolation: { escapeValue: false },
})

export function setLocale(locale: 'vi' | 'en'): void {
    try {
        localStorage.setItem(STORAGE_KEY, locale)
    } catch {
        // Bỏ qua khi storage bị chặn.
    }
    void i18n.changeLanguage(locale)
}

export default i18n
