import { useState } from 'react';
import { settingsAPI } from '../services/Api';

const useSectionFeedback = () => {
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(null);
  const [error,   setError]   = useState(null);

  const clear = () => { setSuccess(null); setError(null); };

  const run = async (fn, successMsg) => {
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

  return { saving, success, error, clear, run };
};

const useSettings = (user, onUserUpdate, onLogout) => {
  const profile     = useSectionFeedback();
  const password    = useSectionFeedback();
  const preferences = useSectionFeedback();
  const privacy     = useSectionFeedback();

  const updateProfile = async ({ name, email, phone }) => {
    const result = await profile.run(
      () => settingsAPI.updateProfile({ name, email, phone }),
      'Profile updated successfully'
    );
    if (result?.success) {
      localStorage.setItem('user', JSON.stringify(result.user));
      onUserUpdate?.(result.user);
    }
  };

  const changePassword = async ({ currentPassword, newPassword }) => {
    await password.run(
      () => settingsAPI.changePassword({ currentPassword, newPassword }),
      'Password changed successfully'
    );
  };

  const updatePreferences = async (optimizationMode) => {
    const result = await preferences.run(
      () => settingsAPI.updatePreferences(optimizationMode),
      'Preferences saved'
    );
    if (result?.success) {
      localStorage.setItem('user', JSON.stringify(result.user));
      onUserUpdate?.(result.user);
    }
  };

  const clearSavedRoutes = async () => {
    await privacy.run(
      () => settingsAPI.clearSavedRoutes(),
      'All saved routes cleared'
    );
  };

  const deleteAccount = async (pwd) => {
    const result = await privacy.run(
      () => settingsAPI.deleteAccount(pwd),
      'Account deleted'
    );
    if (result?.success) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      onLogout?.();
    }
  };

  return {
    profile,
    password,
    preferences,
    privacy,
    updateProfile,
    changePassword,
    updatePreferences,
    clearSavedRoutes,
    deleteAccount,
  };
};

export default useSettings;