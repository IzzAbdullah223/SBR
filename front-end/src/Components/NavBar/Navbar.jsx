import { Bus, Settings, LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './Navbar.module.css';

const Navbar = ({ onSignUpClick, onLoginClick, user }) => {
  const navigate = useNavigate();

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <Bus size={18} />
        </div>
        <span className={styles.logoText}>
          Smart <span className={styles.logoAccent}>Bus</span> Planner
        </span>
        <div className={styles.logoBadge}>Dubai RTA</div>
      </div>

      <div className={styles.actions}>
        {/* Settings — only visible when logged in, navigates to /settings page */}
        {user && (
          <button className={styles.settingsBtn} onClick={() => navigate('/settings')}>
            <Settings size={15} />
            <span>Settings</span>
          </button>
        )}

        <div className={styles.divider} />

        {user ? (
          <span className={styles.greeting}>Hello, <strong>{user.name}</strong></span>
        ) : (
          <>
            <button className={styles.loginBtn} onClick={onLoginClick}>
              <LogIn size={15} />
              <span>Login</span>
            </button>
            <button className={styles.signupBtn} onClick={onSignUpClick}>
              <UserPlus size={15} />
              <span>Sign Up</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;