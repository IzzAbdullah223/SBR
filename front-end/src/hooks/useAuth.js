import { useState, useEffect } from 'react';

const useAuth = () => {

  const [user, setUser]         = useState(null);
  const [showLogin, setShowLogin]   = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  // Theme — read from localStorage first, fall back to 'light'
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'light'
  );

  // Apply theme to root element whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // ── RESTORE USER ON PAGE REFRESH ──────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      if (payload.exp * 1000 > Date.now()) {
        // Step 1 — restore immediately from localStorage (fast, no flicker)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser(payload.user);
        }

        // Step 2 — fetch fresh profile from backend in background
        fetch('/api/settings/profile', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(res => res.json())
          .then(data => {
            if (data?.success && data?.user) {
              setUser(data.user);
              localStorage.setItem('user', JSON.stringify(data.user));
            }
          })
          .catch(() => {});

      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, []);

  // ── AUTH HANDLERS ──────────────────────────────────────────────────────────

  const handleLoginSuccess = (loggedInUser) => {
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setShowLogin(false);
    setShowSignUp(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleSwitchToSignUp = () => { setShowLogin(false);  setShowSignUp(true);  };
  const handleSwitchToLogin  = () => { setShowSignUp(false); setShowLogin(true);   };

  return {
    user,
    theme,
    toggleTheme,
    showLogin,
    showSignUp,
    handleLoginSuccess,
    handleLogout,
    handleSwitchToSignUp,
    handleSwitchToLogin,
    openLogin:   () => setShowLogin(true),
    openSignUp:  () => setShowSignUp(true),
    closeLogin:  () => setShowLogin(false),
    closeSignUp: () => setShowSignUp(false),
  };
};

export default useAuth;