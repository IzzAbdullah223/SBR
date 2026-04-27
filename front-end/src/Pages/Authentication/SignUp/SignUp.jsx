
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema } from '../../../lib/schemas';
import { authAPI } from '../../../services/Api';
import { useTranslation } from 'react-i18next';
import styles from './SignUp.module.css';

export function SignUp({ onLoginSuccess }) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm({ resolver: zodResolver(signUpSchema) });

  const onSubmit = async (data) => {
    try {
      const result = await authAPI.signup(data.name, data.email, data.password, data.phone);
      localStorage.setItem('token', result.token);
      onLoginSuccess(result.user);
      reset();
    } catch (err) {
      setError('email', { type: 'server', message: err.message || 'Signup failed' });
    }
  };

  return (
    <div className={styles.container}>
      <h1>{t('auth.createAccount')}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.field}>
          <label>{t('auth.nameLabel')}</label>
          <input {...register('name')} type="text" placeholder={t('auth.namePlaceholder')} />
          {errors.name && <p className={styles.error}>{errors.name.message}</p>}
        </div>

        <div className={styles.field}>
          <label>{t('auth.emailLabel')}</label>
          <input {...register('email')} type="email" placeholder={t('auth.emailPlaceholder')} />
          {errors.email && <p className={styles.error}>{errors.email.message}</p>}
        </div>

        <div className={styles.field}>
          <label>{t('auth.phoneLabel')}</label>
          <input {...register('phone')} type="text" placeholder={t('auth.phonePlaceholder')} />
          {errors.phone && <p className={styles.error}>{errors.phone.message}</p>}
        </div>

        <div className={styles.field}>
          <label>{t('auth.passwordLabel')}</label>
          <input {...register('password')} type="password" placeholder={t('auth.passwordPlaceholder')} />
          {errors.password && <p className={styles.error}>{errors.password.message}</p>}
        </div>

        <div className={styles.field}>
          <label>{t('auth.confirmPasswordLabel')}</label>
          <input {...register('confirmPassword')} type="password" placeholder={t('auth.passwordPlaceholder')} />
          {errors.confirmPassword && <p className={styles.error}>{errors.confirmPassword.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('auth.creatingAccount') : t('auth.signUpBtn')}
        </button>
      </form>
    </div>
  );
}
