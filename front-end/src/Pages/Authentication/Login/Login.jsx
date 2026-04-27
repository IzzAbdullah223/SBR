

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../../../lib/schemas';
import { authAPI } from '../../../services/Api';
import { useTranslation } from 'react-i18next';
import styles from './Login.module.css';

export function Login({ onLoginSuccess, onSwitchToSignUp }) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data) => {
    try {
      const result = await authAPI.login(data.email, data.password);
      if (!result.token || !result.user) {
        setError('root', { message: t('auth.loginFailed') });
        return;
      }
      localStorage.setItem('token', result.token);
      onLoginSuccess(result.user);
      reset();
    } catch (err) {
      const message = err.message || 'Invalid email or password';
      const isAuthError = message.toLowerCase().includes('email') ||
                          message.toLowerCase().includes('password') ||
                          message.toLowerCase().includes('incorrect') ||
                          message.toLowerCase().includes('invalid');
      if (isAuthError) {
        setError('password', { type: 'server', message });
      } else {
        setError('root', { type: 'server', message });
      }
    }
  };

  return (
    <div className={styles.container}>
      <h1>{t('auth.welcomeBack')}</h1>
      <p className={styles.subtitle}>{t('auth.loginSubtitle')}</p>

      {errors.root && (
        <div className={styles.formError}>{errors.root.message}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.field}>
          <label>{t('auth.emailLabel')}</label>
          <input
            {...register('email')}
            type="email"
            placeholder={t('auth.emailPlaceholder')}
            className={errors.email ? styles.inputError : ''}
          />
          {errors.email && <p className={styles.error}>{errors.email.message}</p>}
        </div>
        <div className={styles.field}>
          <label>{t('auth.passwordLabel')}</label>
          <input
            {...register('password')}
            type="password"
            placeholder={t('auth.passwordPlaceholder')}
            className={errors.password ? styles.inputError : ''}
          />
          {errors.password && <p className={styles.error}>{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('auth.loggingIn') : t('auth.loginBtn')}
        </button>
      </form>

      {onSwitchToSignUp && (
        <p className={styles.switchText}>
          {t('auth.noAccount')}{' '}
          <button className={styles.switchBtn} onClick={onSwitchToSignUp} type="button">
            {t('auth.signUpLink')}
          </button>
        </p>
      )}
    </div>
  );
}