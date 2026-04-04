import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './i18n/translations/en';
import ar from './i18n/translations/ar';

const savedLang = localStorage.getItem('sbr-lang');
const browserLang = navigator.language?.startsWith('ar') ? 'ar' : 'en';
const initialLang = savedLang || browserLang;

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
    interpolation: { escapeValue: false },
  });

let skipNextDbSave = false;

export const skipDbSave = () => { skipNextDbSave = true; };

i18n.on('languageChanged', (lng) => {
  document.documentElement.setAttribute('dir', lng === 'ar' ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lng);
  localStorage.setItem('sbr-lang', lng);

  if (skipNextDbSave) {
    skipNextDbSave = false;
    return;
  }

  const token = localStorage.getItem('token');
  if (token) {
    fetch('/api/settings/language', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ language: lng }),
    }).catch(() => {});
  }
});

export default i18n;