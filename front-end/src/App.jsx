// App.jsx — single owner of auth state
// useAuth lives HERE only — both Home and Settings receive user/handlers as props
// This ensures logout in Settings immediately updates Home (shared state, not two instances)

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Home from './Pages/Home/Home';
import Settings from './Pages/Settings/Settings';
import useAuth from './hooks/useAuth';

function App() {
  const {
    user,
    showLogin,
    showSignUp,
    handleLoginSuccess,
    handleLogout,
    handleSwitchToSignUp,
    handleSwitchToLogin,
    openLogin,
    openSignUp,
    closeLogin,
    closeSignUp,
  } = useAuth();

  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={
            <Home
              user={user}
              showLogin={showLogin}
              showSignUp={showSignUp}
              handleLoginSuccess={handleLoginSuccess}
              handleSwitchToSignUp={handleSwitchToSignUp}
              handleSwitchToLogin={handleSwitchToLogin}
              openLogin={openLogin}
              openSignUp={openSignUp}
              closeLogin={closeLogin}
              closeSignUp={closeSignUp}
            />
          }
        />

        <Route
          path="/settings"
          element={
            user
              ? <Settings
                  user={user}
                  onUserUpdate={handleLoginSuccess}
                  onLogout={handleLogout}
                />
              : <Navigate to="/" replace />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
