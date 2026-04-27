import { useState, useEffect, useRef } from 'react';
import i18n, { skipDbSave } from '../i18n';
import { authAPI } from '../services/Api';

const useAuth = () => {
  const [user, setUser]             = useState(null);
  const [showLogin, setShowLogin]   = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const profileFetched              = useRef(false);

  const [theme, setTheme] = useState(
    () => localStorage.getItem('token') ? (localStorage.getItem('theme') || 'light') : 'light'
  );

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      if (payload.exp * 1000 > Date.now()) {
        const storedUser    = localStorage.getItem('user');
        const immediateUser = storedUser ? JSON.parse(storedUser) : payload.user;

        const lang = immediateUser?.preferences?.language;
        if (lang && lang !== i18n.language) { skipDbSave(); i18n.changeLanguage(lang); }

        authAPI.getProfile()
          .then(data => {
            if (data?.success && data?.user) {
              const freshUser = data.user;
              localStorage.setItem('user', JSON.stringify(freshUser));
              const freshLang = freshUser?.preferences?.language;
              if (freshLang && freshLang !== i18n.language) { skipDbSave(); i18n.changeLanguage(freshLang); }
              profileFetched.current = true;
              setUser(freshUser);
            } else {
              profileFetched.current = true;
              setUser(immediateUser);
            }
          })
          .catch(() => {
            profileFetched.current = true;
            setUser(immediateUser);
          });
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
    profileFetched.current = true;
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
    profileFetched.current = false;
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