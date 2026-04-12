import { useState, useEffect } from 'react';
import i18n, { skipDbSave } from '../i18n';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  const [theme, setTheme] = useState(
    () => localStorage.getItem('token') ? (localStorage.getItem('theme') || 'light') : 'light'
  );

  // Persist theme to localStorage only — App.jsx div carries data-theme so
  // CSS variables always target the correct root element
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      if (payload.exp * 1000 > Date.now()) {
  const storedUser = localStorage.getItem('user');
  //  always set user immediately from best available data
  // so saved routes and favorite stops start loading right away
  // without waiting for the profile network request to complete
  const immediateUser = storedUser ? JSON.parse(storedUser) : payload.user;
  setUser(immediateUser);
  const lang = immediateUser?.preferences?.language;
  if (lang && lang !== i18n.language) {
    skipDbSave();
    i18n.changeLanguage(lang);
  }

        fetch('/api/settings/profile', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(res => res.json())
          .then(data => {
            if (data?.success && data?.user) {
              setUser(data.user);
              localStorage.setItem('user', JSON.stringify(data.user));
              const lang = data.user?.preferences?.language;
              if (lang && lang !== i18n.language) {
                skipDbSave();
                i18n.changeLanguage(lang);
              }
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

  const handleLoginSuccess = (loggedInUser) => {
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    const lang = loggedInUser?.preferences?.language || 'en';
    skipDbSave();
    i18n.changeLanguage(lang);
    setShowLogin(false);
    setShowSignUp(false);
  };

  const handleLogout = () => {
    skipDbSave();
    i18n.changeLanguage('en');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('theme');
    localStorage.removeItem('sbr-lang');
    setUser(null);
    setTheme('light');
  };

  const handleSwitchToSignUp = () => { setShowLogin(false); setShowSignUp(true); };
  const handleSwitchToLogin  = () => { setShowSignUp(false); setShowLogin(true); };

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