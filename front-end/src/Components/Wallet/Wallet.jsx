import { useState } from 'react';
import { AlertCircle, Clock, TrendingUp } from 'lucide-react';
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className={styles.container}>

      <div className={styles.balanceCard}>
        <div className={styles.simBadge}>Simulation Mode</div>

        <div className={styles.cardTopRow}>
          <div>
            <p className={styles.cardType}>Silver Nol Card</p>
            <span className={styles.cardLabel}>{t('settings.walletBalance')}</span>
          </div>
          {wallet.isBalanceLow && (
            <span className={styles.lowTag}>{t('settings.lowBalance')}</span>
          )}
        </div>

        <span className={styles.balanceAmount}>
          {wallet.balance.toFixed(2)}
          <span className={styles.aed}> {t('settings.aed')}</span>
        </span>

        <div className={styles.cardMeta}>
          <div className={styles.cardMetaItem}>
            <span className={styles.cardMetaLabel}>Valid For</span>
            <span className={styles.cardMetaValue}>Bus · Metro · Tram · Water Bus</span>
          </div>
          <div className={styles.cardMetaItem}>
            <span className={styles.cardMetaLabel}>Issued By</span>
            <span className={styles.cardMetaValue}>Roads & Transport Authority</span>
          </div>
        </div>

        <div className={styles.cardFooter}>
          <div>
            <span className={styles.cardNumberLabel}>{t('settings.cardNumber')}</span>
            <span className={styles.cardNumber}>{wallet.cardNumber}</span>
          </div>
          <span className={styles.cardStatus}>● Active</span>
        </div>

        <p className={styles.disclaimer}>Not connected to real RTA Nol system</p>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <TrendingUp size={14} className={styles.statIcon} />
          <span className={styles.statValue}>{wallet.stats?.totalRecharges?.toFixed(2) || '0.00'}</span>
          <span className={styles.statLabel}>Total Topped Up (AED)</span>
        </div>
        <div className={styles.statBox}>
          <Clock size={14} className={styles.statIcon} />
          <span className={styles.statValue}>{formatDate(wallet.stats?.lastRecharge)}</span>
          <span className={styles.statLabel}>Last Top-Up</span>
        </div>
      </div>

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