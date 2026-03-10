import { useState, useEffect } from 'react';

// useAuth centralizes everything auth-related so Home.jsx doesn't have to.
// it manages: user state, token restore on refresh, login/logout,
// modal visibility, and switching between login ↔ signup modals.
const useAuth = () => {

  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  // ── RESTORE USER ON PAGE REFRESH ──────────────────────────────────────────
  // ✅ FIXED: previously decoded user from JWT payload which only has { id, email }
  // so user.name was always undefined → navbar showed "Hello," with no name.
  // Fix: store the full user object in localStorage on login/signup,
  // restore from there on refresh (token still verified for expiry).
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // verify token isn't expired — decode the payload middle section
      const payload = JSON.parse(atob(token.split('.')[1]));

      if (payload.exp * 1000 > Date.now()) {
        // ✅ restore from stored user object (has name, email, phone etc.)
        // not from JWT payload (which only has id + email)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          // fallback: use whatever is in the token payload
          setUser(payload.user);
        }
      } else {
        // token expired — clean up everything
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
    // ✅ save full user object to localStorage so refresh restores the name
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setShowLogin(false);
    setShowSignUp(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // ✅ also clear stored user object
    setUser(null);
  };

  const handleSwitchToSignUp = () => { setShowLogin(false); setShowSignUp(true); };
  const handleSwitchToLogin  = () => { setShowSignUp(false); setShowLogin(true); };

  return {
    user,
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