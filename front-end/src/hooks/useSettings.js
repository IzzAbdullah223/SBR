/**
 * useSettings — all settings logic in one place
 * Handles: profile update, password change, preferences, clear routes, delete account
 * Settings.jsx is pure UI — all API calls and state live here
 */

import { useState } from 'react';
import { settingsAPI } from '../services/Api';

const useSettings = (user, onUserUpdate, onLogout) => {

  const [saving, setSaving]   = useState(false); // any save in flight
  const [success, setSuccess] = useState(null);  // success message string
  const [error, setError]     = useState(null);  // error message string

  const clear = () => { setSuccess(null); setError(null); };

  const withFeedback = async (fn, successMsg) => {
    clear();
    setSaving(true);
    try {
      const result = await fn();
      setSuccess(successMsg);
      return result;
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  // ── PROFILE ───────────────────────────────────────────────────────────────
  const updateProfile = async ({ name, email, phone }) => {
    const result = await withFeedback(
      () => settingsAPI.updateProfile({ name, email, phone }),
      'Profile updated successfully'
    );
    if (result?.success) {
      // update stored user in localStorage + parent state
      const updated = result.user;
      localStorage.setItem('user', JSON.stringify(updated));
      onUserUpdate?.(updated);
    }
  };

  // ── PASSWORD ──────────────────────────────────────────────────────────────
  const changePassword = async ({ currentPassword, newPassword }) => {
    await withFeedback(
      () => settingsAPI.changePassword({ currentPassword, newPassword }),
      'Password changed successfully'
    );
  };

  // ── PREFERENCES ───────────────────────────────────────────────────────────
  const updatePreferences = async (preferences) => {
    const result = await withFeedback(
      // build the exact body shape the backend expects right here
      // Api.js is just a transport — it sends whatever we give it as-is
      () => settingsAPI.updatePreferences({ preferences }),
      'Preferences saved'
    );
    if (result?.success) {
      const updated = result.user;
      localStorage.setItem('user', JSON.stringify(updated));
      onUserUpdate?.(updated);
    }
  };

  // ── CLEAR SAVED ROUTES ────────────────────────────────────────────────────
  const clearSavedRoutes = async () => {
    await withFeedback(
      () => settingsAPI.clearSavedRoutes(),
      'All saved routes cleared'
    );
  };

  // ── DELETE ACCOUNT ────────────────────────────────────────────────────────
  const deleteAccount = async (password) => {
    const result = await withFeedback(
      () => settingsAPI.deleteAccount(password),
      'Account deleted'
    );
    if (result?.success) {
      // clean up and log out
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      onLogout?.();
    }
  };

  return {
    saving,
    success,
    error,
    clearFeedback: clear,
    updateProfile,
    changePassword,
    updatePreferences,
    clearSavedRoutes,
    deleteAccount,
  };
};

export default useSettings;