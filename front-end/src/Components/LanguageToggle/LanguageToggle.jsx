
import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LanguageToggle.module.css';

const LanguageToggle = () => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const toggle = () => {
    i18n.changeLanguage(isArabic ? 'en' : 'ar');
  };

  return (
    <button
      className={styles.pill}
      onClick={toggle}
      title={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}
      aria-label={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      {/* Active language label */}
      <span className={`${styles.lang} ${styles.active}`}>
        {isArabic ? 'AR' : 'EN'}
      </span>

      {/* Divider */}
      <span className={styles.divider}>|</span>

      {/* Inactive language label */}
      <span className={styles.lang}>
        {isArabic ? 'EN' : 'AR'}
      </span>
    </button>
  );
};

export default LanguageToggle;
