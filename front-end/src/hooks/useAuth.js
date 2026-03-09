import { useState, useEffect } from 'react';


const useAuth = () => {

  const [user, setUser] = useState(null);

  // showLogin / showSignUp control which modal is open
  // only one should ever be true at a time
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  // ── RESTORE USER ON PAGE REFRESH ──────────────────────────────────────────
  // runs once when the app loads
  // if a token exists in localStorage the user was previously logged in
  // decode it and restore their state so they don't have to login again
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return; // no token — user was never logged in

    try {
      // JWT = header.payload.signature — we decode the middle part (payload)
      // atob decodes base64 back to readable JSON
      const payload = JSON.parse(atob(token.split('.')[1]));

      // payload.exp is expiry in seconds, Date.now() is milliseconds
      if (payload.exp * 1000 > Date.now()) {
        setUser(payload.user); // restore user state
      } else {
        localStorage.removeItem('token'); // token expired — clean up
      }
    } catch {
      localStorage.removeItem('token'); // token malformed — clean up
    }
  }, []); // empty array = only runs once on mount

  // ── AUTH HANDLERS ──────────────────────────────────────────────────────────

  // called by both Login and SignUp on success
  // token already saved in localStorage by Login/SignUp before this is called
  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser); // show user in navbar
    setShowLogin(false);   // close login modal
    setShowSignUp(false);  // close signup modal
  };

  // called when user clicks logout in navbar
  const handleLogout = () => {
    localStorage.removeItem('token'); // clear token so refresh doesn't restore them
    setUser(null);                    // clear user — navbar goes back to login/signup buttons
  };

  // ── MODAL SWITCHERS ────────────────────────────────────────────────────────
  // these let Login say "switch to signup" and SignUp say "switch to login"
  // without the user having to close the modal and open a different one

  const handleSwitchToSignUp = () => {
    setShowLogin(false);
    setShowSignUp(true);
  };

  const handleSwitchToLogin = () => {
    setShowSignUp(false);
    setShowLogin(true);
  };

  return {
    // state
    user,
    showLogin,
    showSignUp,

    // handlers for Home.jsx to wire up
    handleLoginSuccess,
    handleLogout,
    handleSwitchToSignUp,
    handleSwitchToLogin,

    // modal open/close — used by Navbar buttons and modal onClose
    openLogin:   () => setShowLogin(true),
    openSignUp:  () => setShowSignUp(true),
    closeLogin:  () => setShowLogin(false),
    closeSignUp: () => setShowSignUp(false),
  };
};

export default useAuth;