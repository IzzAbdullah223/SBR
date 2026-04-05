import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './Wallet.module.css';

const WalletCard = ({
  wallet,
  loadingWallet,
  recharging,
  walletError,
  setWalletError,
  recharge,
}) => {
  const { t } = useTranslation();
  const [rechargeAmount, setRechargeAmount] = useState('');

  const handleRecharge = async () => {
    const amount = parseFloat(rechargeAmount);
    if (!amount || amount <= 0) return;
    const ok = await recharge(amount);
    if (ok) setRechargeAmount('');
  };

  if (loadingWallet) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>{t('settings.walletLoading')}</span>
      </div>
    );
  }

  if (!wallet) return null;

  return (
    <div className={styles.container}>

      {/* ── Balance card ── */}
      <div className={styles.balanceCard}>
        <div className={styles.cardTopRow}>
          <span className={styles.cardLabel}>{t('settings.walletBalance')}</span>
          {wallet.isBalanceLow && (
            <span className={styles.lowTag}>{t('settings.lowBalance')}</span>
          )}
        </div>
        <span className={styles.balanceAmount}>
          {wallet.balance.toFixed(2)}
          <span className={styles.aed}> {t('settings.aed')}</span>
        </span>
        <div className={styles.cardFooter}>
          <span className={styles.cardNumberLabel}>{t('settings.cardNumber')}</span>
          <span className={styles.cardNumber}>{wallet.cardNumber}</span>
        </div>
      </div>

      {/* ── Top-up row ── */}
      <div className={styles.topUpRow}>
        <div className={styles.inputWrap}>
          <label className={styles.inputLabel}>{t('settings.rechargeAmount')}</label>
          <input
            className={styles.input}
            type="number"
            min="1"
            max="500"
            step="0.5"
            value={rechargeAmount}
            onChange={e => { setRechargeAmount(e.target.value); setWalletError(null); }}
            placeholder="e.g. 50"
          />
        </div>
        <button
          className={styles.topUpBtn}
          onClick={handleRecharge}
          disabled={recharging || !rechargeAmount}
        >
          {recharging ? t('settings.recharging') : t('settings.rechargeBtn')}
        </button>
      </div>

      {walletError && (
        <p className={styles.error}>
          <AlertCircle size={12} /> {walletError}
        </p>
      )}

    </div>
  );
};

export default WalletCard;