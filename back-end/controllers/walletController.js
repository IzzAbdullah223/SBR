import VirtualWallet from '../models/Virtualwallet.js';

export const getWallet = async (req, res) => {
  try {
    let wallet = await VirtualWallet.findByUserId(req.user.id);

    if (!wallet) {
      wallet = await VirtualWallet.create({ userId: req.user.id, balance: 50 });
    }

    res.json({
      success: true,
      data: {
        balance:            wallet.balance,
        cardNumber:         wallet.cardNumber,
        status:             wallet.status,
        isBalanceLow:       wallet.isBalanceLow(),
        lowThreshold:       wallet.lowBalanceThreshold,
        stats:              wallet.stats,
        recentTransactions: wallet.getTransactionHistory(5),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch wallet', error: err.message });
  }
};

export const rechargeWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    const parsed = parseFloat(amount);

    if (!parsed || parsed <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
    }

    if (parsed > 500) {
      return res.status(400).json({ success: false, message: 'Maximum single top-up is 500 AED' });
    }

    let wallet = await VirtualWallet.findByUserId(req.user.id);
    if (!wallet) wallet = await VirtualWallet.create({ userId: req.user.id, balance: 50 });

    if (wallet.balance + parsed > 500) {
      return res.status(400).json({
        success: false,
        message: `Maximum balance is 500 AED. You can top up ${(500 - wallet.balance).toFixed(2)} AED more.`,
      });
    }

    await wallet.recharge(parsed, `Top-up of ${parsed} AED`);

    res.json({
      success: true,
      data: {
        balance:      wallet.balance,
        cardNumber:   wallet.cardNumber,
        isBalanceLow: wallet.isBalanceLow(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to recharge wallet', error: err.message });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const skip  = parseInt(req.query.skip)  || 0;

    const wallet = await VirtualWallet.findByUserId(req.user.id);
    if (!wallet) return res.json({ success: true, data: [] });

    res.json({
      success: true,
      data: wallet.getTransactionHistory(limit, skip),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch transactions', error: err.message });
  }
};