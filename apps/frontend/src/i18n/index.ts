import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '@/i18n/en.json'
import lt from '@/i18n/lt.json'

const STORAGE_KEY = 'pamaina_language'

function getStoredLanguage(): string {
  return localStorage.getItem(STORAGE_KEY) ?? 'lt'
}

void i18n.use(initReactI18next).init({
  resources: {
    lt: { translation: lt },
    en: { translation: en },
  },
  lng: getStoredLanguage(),
  fallbackLng: 'lt',
  interpolation: { escapeValue: false },
})

/** Switches the UI language and persists the choice for the next visit. */
export function setAppLanguage(language: string): void {
  localStorage.setItem(STORAGE_KEY, language)
  void i18n.changeLanguage(language)
}

export default i18n
