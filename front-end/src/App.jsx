import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Home from './Pages/Home/Home';
import Settings from './Pages/Settings/Settings';
import useAuth from './hooks/useAuth';

function App() {
  const {
    user,
    theme,
    toggleTheme,
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
    // data-theme on the root div — all CSS variables switch instantly
    <div className="App" data-theme={theme}>
      <BrowserRouter>
        <Routes>

          <Route
            path="/"
            element={
              <Home
                user={user}
                theme={theme}
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
                    theme={theme}
                    toggleTheme={toggleTheme}
                  />
                : <Navigate to="/" replace />
            }
          />

        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;