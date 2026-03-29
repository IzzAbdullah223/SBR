import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Lock, Zap, Monitor, Eye,
  Shield, LogOut, ArrowLeft, ChevronDown,
  CheckCircle, AlertCircle, Trash2, X, Bus
} from 'lucide-react';
import useSettings from '../../hooks/useSettings';
import styles from './Settings.module.css';

// ── Accordion wrapper ──────────────────────────────────────────────────────
const Accordion = ({ icon: Icon, title, hint, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.accordion}>
      <button className={styles.accordionTrigger} onClick={() => setOpen(v => !v)}>
        <div className={styles.triggerIcon}><Icon size={16} /></div>
        <div className={styles.triggerText}>
          <p className={styles.triggerTitle}>{title}</p>
          <p className={styles.triggerHint}>{hint}</p>
        </div>
        <ChevronDown size={16} className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
      </button>
      <div className={`${styles.accordionBody} ${open ? styles.accordionOpen : ''}`}>
        <div className={styles.accordionInner}>
          {children}
        </div>
      </div>
    </div>
  );
};

// ── Confirm modal ──────────────────────────────────────────────────────────
const ConfirmModal = ({ title, message, onConfirm, onCancel, requirePassword }) => {
  const [password, setPassword] = useState('');
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.modalClose} onClick={onCancel}><X size={13} /></button>
        <h3 className={styles.modalTitle}>{title}</h3>
        <p className={styles.modalMessage}>{message}</p>
        {requirePassword && (
          <input
            type="password"
            placeholder="Enter your password to confirm"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={styles.input}
            autoFocus
          />
        )}
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button
            className={styles.dangerBtn}
            onClick={() => onConfirm(password)}
            disabled={requirePassword && !password}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────
const Settings = ({ user, onUserUpdate, onLogout, theme, toggleTheme }) => {
  const navigate = useNavigate();

  const {
    saving, success, error, clearFeedback,
    updateProfile, changePassword, updatePreferences,
    clearSavedRoutes, deleteAccount,
  } = useSettings(user, onUserUpdate, onLogout);

  // Profile
  const [name,  setName]  = useState(user?.name  || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Password
  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError,   setPwError]   = useState('');

  // Preferences — optimization mode
  const [optimizationMode, setOptimizationMode] = useState(
    user?.preferences?.optimizationMode || 'fastest'
  );

  // Re-sync when user prop updates
  useEffect(() => {
    setOptimizationMode(user?.preferences?.optimizationMode || 'fastest');
  }, [user?.preferences?.optimizationMode]);

  // Display
  const [mapStyle, setMapStyle] = useState('standard');

  // Accessibility
  const [largeText,        setLargeText]        = useState(false);
  const [reduceAnimations, setReduceAnimations] = useState(false);

  // Confirm modal
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    if (user) { setName(user.name || ''); setEmail(user.email || ''); setPhone(user.phone || ''); }
  }, [user]);

  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(clearFeedback, 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  const handleProfileSave = (e) => {
    e.preventDefault();
    updateProfile({ name, email, phone });
  };

  const handlePasswordSave = (e) => {
    e.preventDefault();
    setPwError('');
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return; }
    if (newPw.length < 6)    { setPwError('Must be at least 6 characters'); return; }
    changePassword({ currentPassword: currentPw, newPassword: newPw });
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
  };

  const handleConfirm = async (password) => {
    if (confirm?.type === 'clearRoutes')   await clearSavedRoutes();
    if (confirm?.type === 'deleteAccount') await deleteAccount(password);
    setConfirm(null);
  };

  return (
    <div className={styles.page}>

      {/* Top bar */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Back
        </button>
        <Bus size={15} color="#f0a500" />
        <span className={styles.pageTitle}>Settings</span>
      </div>

      <div className={styles.content}>

        {/* ── 1. Profile ── */}
        <Accordion icon={User} title="Profile" hint="Name, email and phone number">
          <form onSubmit={handleProfileSave} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.formRow}>
                <label className={styles.label}>Full Name</label>
                <input className={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div className={styles.formRow}>
                <label className={styles.label}>Phone</label>
                <input className={styles.input} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+971 50 000 0000" />
              </div>
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Email Address</label>
              <input className={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </Accordion>

        {/* ── 2. Change Password ── */}
        <Accordion icon={Lock} title="Change Password" hint="Update your account password">
          <form onSubmit={handlePasswordSave} className={styles.form}>
            <div className={styles.formRow}>
              <label className={styles.label}>Current Password</label>
              <input className={styles.input} type="password" autoComplete="current-password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formRow}>
                <label className={styles.label}>New Password</label>
                <input className={styles.input} type="password" autoComplete="new-password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••" />
              </div>
              <div className={styles.formRow}>
                <label className={styles.label}>Confirm Password</label>
                <input className={styles.input} type="password" autoComplete="new-password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" />
              </div>
            </div>
            {pwError && <p className={styles.fieldError}><AlertCircle size={12} /> {pwError}</p>}
            <button type="submit" className={styles.saveBtn} disabled={saving || !currentPw || !newPw || !confirmPw}>
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </Accordion>

        {/* ── 3. Preferences ── */}
        <Accordion icon={Zap} title="Preferences" hint="Optimize routes for what matters to you">
          <div className={styles.form}>
            <div className={styles.formRow}>
              <label className={styles.label}>Optimize routes for</label>
              <select
                className={styles.select}
                value={optimizationMode}
                onChange={e => setOptimizationMode(e.target.value)}
              >
                <option value="fastest">🚀 Fastest route</option>
                <option value="cheapest">💰 Cheapest route</option>
                <option value="less_walking">🚶 Less walking</option>
                <option value="fewest_transfers">🔄 Fewest transfers</option>
              </select>
            </div>
            {(success || error) && (
              <div className={`${styles.inlineFeedback} ${error ? styles.inlineFeedbackError : styles.inlineFeedbackSuccess}`}>
                {error ? <AlertCircle size={13} /> : <CheckCircle size={13} />}
                <span>{error || success}</span>
              </div>
            )}
            <button
              className={styles.saveBtn}
              style={{ marginTop: 8 }}
              onClick={() => updatePreferences(optimizationMode)}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </Accordion>

        {/* ── 4. Display ── */}
        <Accordion icon={Monitor} title="Display" hint="Map style and appearance">
          <div className={styles.toggleRow}>
            <div>
              <p className={styles.toggleLabel}>Dark Mode</p>
              <p className={styles.toggleHint}>Switch between light and dark appearance</p>
            </div>
            <button
              className={`${styles.toggle} ${theme === 'dark' ? styles.toggleOn : ''}`}
              onClick={toggleTheme}
            >
              <div className={styles.toggleThumb} />
            </button>
          </div>
        </Accordion>

        {/* ── 5. Accessibility ── */}
        <Accordion icon={Eye} title="Accessibility" hint="Text size and motion settings">
          {[
            { label: 'Larger Text',        hint: 'Increases font size across the app',             state: largeText,        set: setLargeText        },
            { label: 'Reduce Animations',  hint: 'Disables map fly animations and transitions',    state: reduceAnimations, set: setReduceAnimations },
          ].map(({ label, hint, state, set }) => (
            <div key={label} className={styles.toggleRow}>
              <div>
                <p className={styles.toggleLabel}>{label}</p>
                <p className={styles.toggleHint}>{hint}</p>
              </div>
              <button className={`${styles.toggle} ${state ? styles.toggleOn : ''}`} onClick={() => set(v => !v)}>
                <div className={styles.toggleThumb} />
              </button>
            </div>
          ))}
        </Accordion>

        {/* ── 6. Privacy & Data ── */}
        <Accordion icon={Shield} title="Privacy & Data" hint="Manage your data and account">
          <div className={styles.dangerRow}>
            <div>
              <p className={styles.dangerLabel}>Clear Saved Routes</p>
              <p className={styles.dangerHint}>Permanently removes all your saved journeys</p>
            </div>
            <button className={styles.dangerOutlineBtn} onClick={() => setConfirm({ type: 'clearRoutes' })}>
              <Trash2 size={13} /> Clear All
            </button>
          </div>
          <div className={styles.dangerRow}>
            <div>
              <p className={styles.dangerLabel}>Delete Account</p>
              <p className={styles.dangerHint}>Permanently deletes your account and all data</p>
            </div>
            <button
              className={styles.dangerOutlineBtn}
              onClick={() => setConfirm({ type: 'deleteAccount' })}
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </Accordion>

        {/* ── 7. Log Out ── */}
        <Accordion icon={LogOut} title="Log Out" hint="Sign out of your account">
          <div className={styles.logoutRow}>
            <div>
              <p className={styles.logoutLabel}>Log Out</p>
              <p className={styles.logoutHint}>You can log back in at any time</p>
            </div>
            <button className={styles.logoutBtn} onClick={onLogout}>
              <LogOut size={13} /> Log Out
            </button>
          </div>
        </Accordion>

      </div>

      {/* Confirm modal */}
      {confirm && (
        <ConfirmModal
          title={confirm.type === 'clearRoutes' ? 'Clear All Saved Routes?' : 'Delete Account?'}
          message={
            confirm.type === 'clearRoutes'
              ? 'This will permanently remove all your saved journeys. This cannot be undone.'
              : 'This will permanently delete your account and all data. This cannot be undone.'
          }
          requirePassword={confirm.type === 'deleteAccount'}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
};

export default Settings;