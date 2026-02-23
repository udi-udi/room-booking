import { createI18n } from 'vue-i18n'
import he from '@/locales/he.json'
import en from '@/locales/en.json'

const savedLocale = localStorage.getItem('locale') || 'he'

export default createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: {
    he,
    en,
  },
})
