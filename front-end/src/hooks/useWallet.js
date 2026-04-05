import { useState, useCallback, useEffect } from 'react';
import { walletAPI } from '../services/Api';

const useWallet = (user) => {
  const [wallet,        setWallet]        = useState(null);  // { balance, cardNumber, isBalanceLow, stats }
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [recharging,    setRecharging]    = useState(false);
  const [walletError,   setWalletError]   = useState(null);

  const fetchWallet = useCallback(async () => {
    if (!user) return;
    setLoadingWallet(true);
    try {
      const result = await walletAPI.getWallet();
      if (result?.success) setWallet(result.data);
    } catch {
      // silent — wallet section just won't show
    } finally {
      setLoadingWallet(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchWallet();
    } else {
      setWallet(null);
    }
  }, [user]);

  const recharge = useCallback(async (amount) => {
    setRecharging(true);
    setWalletError(null);
    try {
      const result = await walletAPI.recharge(amount);
      if (result?.success) {
        setWallet(prev => ({ ...prev, ...result.data }));
        return true;
      } else {
        setWalletError(result?.message || 'Recharge failed.');
        return false;
      }
    } catch (err) {
      setWalletError(err.message || 'Recharge failed.');
      return false;
    } finally {
      setRecharging(false);
    }
  }, []);

  return {
    wallet,
    loadingWallet,
    recharging,
    walletError,
    setWalletError,
    recharge,
    fetchWallet,
    // Convenience: raw balance number for passing to BusResults
    walletBalance: wallet?.balance ?? null,
  };
};

export default useWallet;