/**
 * Navbar.jsx — updated with i18n + LanguageToggle
 * Replace your existing Navbar.jsx with this file.
 */

import { Bus, Settings, LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../LanguageToggle/LanguageToggle';
import styles from './Navbar.module.css';

const Navbar = ({ onSignUpClick, onLoginClick, user }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <Bus size={18} />
        </div>
        <span className={styles.logoText}>
          {t('navbar.appName')}
        </span>
        <div className={styles.logoBadge}>{t('navbar.badge')}</div>
      </div>

      <div className={styles.actions}>
        {/* Language Toggle — always visible */}
        <LanguageToggle />

        {/* Settings — only visible when logged in */}
        {user && (
          <button className={styles.settingsBtn} onClick={() => navigate('/settings')}>
            <Settings size={15} />
            <span>{t('navbar.settings')}</span>
          </button>
        )}

        <div className={styles.divider} />

        {user ? (
          <span className={styles.greeting}>
            {t('navbar.greeting', { name: user.name }).split(user.name).map((part, i, arr) =>
              i < arr.length - 1
                ? [part, <strong key={i}>{user.name}</strong>]
                : part
            )}
          </span>
        ) : (
          <>
            <button className={styles.loginBtn} onClick={onLoginClick}>
              <LogIn size={15} />
              <span>{t('navbar.login')}</span>
            </button>
            <button className={styles.signupBtn} onClick={onSignUpClick}>
              <UserPlus size={15} />
              <span>{t('navbar.signUp')}</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
