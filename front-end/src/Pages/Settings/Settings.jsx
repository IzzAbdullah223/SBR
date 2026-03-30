/**
 * Settings.jsx — updated with i18n
 * Replace your existing Settings.jsx with this file.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Lock, Zap, Monitor, Eye,
  Shield, LogOut, ArrowLeft, ChevronDown,
  CheckCircle, AlertCircle, Trash2, X, Bus
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useSettings from '../../hooks/useSettings';
import styles from './Settings.module.css';

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
        <div className={styles.accordionInner}>{children}</div>
      </div>
    </div>
  );
};

const ConfirmModal = ({ title, message, onConfirm, onCancel, requirePassword, t }) => {
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
            placeholder={t('settings.confirmPasswordPlaceholder')}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={styles.input}
            autoFocus
          />
        )}
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onCancel}>{t('settings.cancel')}</button>
          <button
            className={styles.dangerBtn}
            onClick={() => onConfirm(password)}
            disabled={requirePassword && !password}
          >
            {t('settings.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

const Settings = ({ user, onUserUpdate, onLogout, theme, toggleTheme }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    saving, success, error, clearFeedback,
    updateProfile, changePassword, updatePreferences,
    clearSavedRoutes, deleteAccount,
  } = useSettings(user, onUserUpdate, onLogout);

  const [name,  setName]  = useState(user?.name  || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError,   setPwError]   = useState('');
  const [optimizationMode, setOptimizationMode] = useState(user?.preferences?.optimizationMode || 'fastest');
  const [largeText,        setLargeText]        = useState(false);
  const [reduceAnimations, setReduceAnimations] = useState(false);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    setOptimizationMode(user?.preferences?.optimizationMode || 'fastest');
  }, [user?.preferences?.optimizationMode]);

  useEffect(() => {
    if (user) { setName(user.name || ''); setEmail(user.email || ''); setPhone(user.phone || ''); }
  }, [user]);

  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(clearFeedback, 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  const handleProfileSave = (e) => { e.preventDefault(); updateProfile({ name, email, phone }); };

  const handlePasswordSave = (e) => {
    e.preventDefault();
    setPwError('');
    if (newPw !== confirmPw) { setPwError(t('settings.passwordMismatch')); return; }
    if (newPw.length < 6)    { setPwError(t('settings.passwordTooShort')); return; }
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
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> {t('settings.back')}
        </button>
        <Bus size={15} color="#f0a500" />
        <span className={styles.pageTitle}>{t('settings.title')}</span>
      </div>

      <div className={styles.content}>

        {/* 1. Profile */}
        <Accordion icon={User} title={t('settings.profile')} hint={t('settings.profileHint')}>
          <form onSubmit={handleProfileSave} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.formRow}>
                <label className={styles.label}>{t('settings.fullName')}</label>
                <input className={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder={t('settings.namePlaceholder')} />
              </div>
              <div className={styles.formRow}>
                <label className={styles.label}>{t('settings.phone')}</label>
                <input className={styles.input} value={phone} onChange={e => setPhone(e.target.value)} placeholder={t('settings.phonePlaceholder')} />
              </div>
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>{t('settings.emailAddress')}</label>
              <input className={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('settings.emailPlaceholder')} />
            </div>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? t('settings.saving') : t('settings.saveChanges')}
            </button>
          </form>
        </Accordion>

        {/* 2. Change Password */}
        <Accordion icon={Lock} title={t('settings.changePassword')} hint={t('settings.changePasswordHint')}>
          <form onSubmit={handlePasswordSave} className={styles.form}>
            <div className={styles.formRow}>
              <label className={styles.label}>{t('settings.currentPassword')}</label>
              <input className={styles.input} type="password" autoComplete="current-password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formRow}>
                <label className={styles.label}>{t('settings.newPassword')}</label>
                <input className={styles.input} type="password" autoComplete="new-password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••" />
              </div>
              <div className={styles.formRow}>
                <label className={styles.label}>{t('settings.confirmPassword')}</label>
                <input className={styles.input} type="password" autoComplete="new-password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" />
              </div>
            </div>
            {pwError && <p className={styles.fieldError}><AlertCircle size={12} /> {pwError}</p>}
            <button type="submit" className={styles.saveBtn} disabled={saving || !currentPw || !newPw || !confirmPw}>
              {saving ? t('settings.updating') : t('settings.updatePassword')}
            </button>
          </form>
        </Accordion>

        {/* 3. Preferences */}
        <Accordion icon={Zap} title={t('settings.preferences')} hint={t('settings.preferencesHint')}>
          <div className={styles.form}>
            <div className={styles.formRow}>
              <label className={styles.label}>{t('settings.optimizeFor')}</label>
              <select className={styles.select} value={optimizationMode} onChange={e => setOptimizationMode(e.target.value)}>
                <option value="fastest">{t('settings.optFastest')}</option>
                <option value="cheapest">{t('settings.optCheapest')}</option>
                <option value="less_walking">{t('settings.optLessWalking')}</option>
                <option value="fewest_transfers">{t('settings.optFewestTransfers')}</option>
              </select>
            </div>
            {(success || error) && (
              <div className={`${styles.inlineFeedback} ${error ? styles.inlineFeedbackError : styles.inlineFeedbackSuccess}`}>
                {error ? <AlertCircle size={13} /> : <CheckCircle size={13} />}
                <span>{error || success}</span>
              </div>
            )}
            <button className={styles.saveBtn} style={{ marginTop: 8 }} onClick={() => updatePreferences(optimizationMode)} disabled={saving}>
              {saving ? t('settings.saving') : t('settings.savePreferences')}
            </button>
          </div>
        </Accordion>

        {/* 4. Display */}
        <Accordion icon={Monitor} title={t('settings.display')} hint={t('settings.displayHint')}>
          <div className={styles.toggleRow}>
            <div>
              <p className={styles.toggleLabel}>{t('settings.darkMode')}</p>
              <p className={styles.toggleHint}>{t('settings.darkModeHint')}</p>
            </div>
            <button className={`${styles.toggle} ${theme === 'dark' ? styles.toggleOn : ''}`} onClick={toggleTheme}>
              <div className={styles.toggleThumb} />
            </button>
          </div>
        </Accordion>

        {/* 5. Accessibility */}
        <Accordion icon={Eye} title={t('settings.accessibility')} hint={t('settings.accessibilityHint')}>
          {[
            { labelKey: 'settings.largerText',       hintKey: 'settings.largerTextHint',       state: largeText,        set: setLargeText        },
            { labelKey: 'settings.reduceAnimations',  hintKey: 'settings.reduceAnimationsHint', state: reduceAnimations, set: setReduceAnimations },
          ].map(({ labelKey, hintKey, state, set }) => (
            <div key={labelKey} className={styles.toggleRow}>
              <div>
                <p className={styles.toggleLabel}>{t(labelKey)}</p>
                <p className={styles.toggleHint}>{t(hintKey)}</p>
              </div>
              <button className={`${styles.toggle} ${state ? styles.toggleOn : ''}`} onClick={() => set(v => !v)}>
                <div className={styles.toggleThumb} />
              </button>
            </div>
          ))}
        </Accordion>

        {/* 6. Privacy & Data */}
        <Accordion icon={Shield} title={t('settings.privacy')} hint={t('settings.privacyHint')}>
          <div className={styles.dangerRow}>
            <div>
              <p className={styles.dangerLabel}>{t('settings.clearRoutes')}</p>
              <p className={styles.dangerHint}>{t('settings.clearRoutesHint')}</p>
            </div>
            <button className={styles.dangerOutlineBtn} onClick={() => setConfirm({ type: 'clearRoutes' })}>
              <Trash2 size={13} /> {t('settings.clearAll')}
            </button>
          </div>
          <div className={styles.dangerRow}>
            <div>
              <p className={styles.dangerLabel}>{t('settings.deleteAccount')}</p>
              <p className={styles.dangerHint}>{t('settings.deleteAccountHint')}</p>
            </div>
            <button className={styles.dangerOutlineBtn} onClick={() => setConfirm({ type: 'deleteAccount' })}>
              <Trash2 size={13} /> {t('settings.delete')}
            </button>
          </div>
        </Accordion>

        {/* 7. Log Out */}
        <Accordion icon={LogOut} title={t('settings.logout')} hint={t('settings.logoutHint')}>
          <div className={styles.logoutRow}>
            <div>
              <p className={styles.logoutLabel}>{t('settings.logoutBtn')}</p>
              <p className={styles.logoutHint}>{t('settings.logoutHintSub')}</p>
            </div>
            <button className={styles.logoutBtn} onClick={onLogout}>
              <LogOut size={13} /> {t('settings.logoutBtn')}
            </button>
          </div>
        </Accordion>

      </div>

      {confirm && (
        <ConfirmModal
          title={confirm.type === 'clearRoutes' ? t('settings.clearRoutesTitle') : t('settings.deleteAccountTitle')}
          message={confirm.type === 'clearRoutes' ? t('settings.clearRoutesMessage') : t('settings.deleteAccountMessage')}
          requirePassword={confirm.type === 'deleteAccount'}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
          t={t}
        />
      )}
    </div>
  );
};

export default Settings;
