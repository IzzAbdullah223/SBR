

import { Bus, Settings, LogIn, UserPlus } from 'lucide-react';
import styles from './Navbar.module.css';

const Navbar = () => {
  return (
    <nav className={styles.navbar}>

      {/* ── Left — Logo ── */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <Bus size={18} />
        </div>
        <span className={styles.logoText}>
          Smart <span className={styles.logoAccent}>Bus</span> Planner
        </span>
        <div className={styles.logoBadge}>Dubai RTA</div>
      </div>

      {/* ── Right — Actions ── */}
      <div className={styles.actions}>
        <button className={styles.settingsBtn}>
          <Settings size={15} />
          <span>Settings</span>
        </button>
        <div className={styles.divider} />
        <button className={styles.loginBtn}>
          <LogIn size={15} />
          <span>Login</span>
        </button>
        <button className={styles.signupBtn}>
          <UserPlus size={15} />
          <span>Sign Up</span>
        </button>
      </div>

    </nav>
  );
};

export default Navbar;
