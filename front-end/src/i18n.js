/**
 * i18n.js — i18next configuration
 *
 * SETUP:
 *   npm install i18next react-i18next
 *
 * USAGE in any component:
 *   import { useTranslation } from 'react-i18next';
 *   const { t, i18n } = useTranslation();
 *   t('navbar.appName')           // → 'Smart Bus Planner' or 'مخطط الحافلات الذكي'
 *   t('results.subtitle', { count: 3 })  // → '3 routes ranked...'
 *
 * SWITCH LANGUAGE:
 *   i18n.changeLanguage('ar')  // switches to Arabic + sets dir="rtl" on <html>
 *   i18n.changeLanguage('en')  // switches to English + sets dir="ltr" on <html>
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './i18n/translations/en';
import ar from './i18n/translations/ar';

// Reads saved language from localStorage, or detects browser language,
// falls back to English if neither is available
const savedLang = localStorage.getItem('sbr-lang');
const browserLang = navigator.language?.startsWith('ar') ? 'ar' : 'en';
const initialLang = savedLang || browserLang;

// Apply RTL direction on the <html> element immediately on load
// so there's no flash of wrong direction before React mounts
document.documentElement.setAttribute('dir', initialLang === 'ar' ? 'rtl' : 'ltr');
document.documentElement.setAttribute('lang', initialLang);

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: {
      // React already escapes values — no need for i18next to do it too
      escapeValue: false,
    },
  });

// Whenever the language changes, update <html dir> and <html lang>
// and persist the choice to localStorage
i18n.on('languageChanged', (lng) => {
  document.documentElement.setAttribute('dir', lng === 'ar' ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lng);
  localStorage.setItem('sbr-lang', lng);
});

export default i18n;