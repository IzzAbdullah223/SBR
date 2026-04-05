import mongoose from 'mongoose';

// Transaction Sub-Schema
const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['recharge', 'deduction', 'refund', 'transfer'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  routeInfo: {
    routeNumber: String,
    fromStop:    String,
    toStop:      String
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// Virtual Wallet Schema
const virtualWalletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },

  balance: {
    type: Number,
    default: 0,
    min: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },

  cardNumber: {
    type: String,
    unique: true,
    sparse: true
  },

  transactions: [transactionSchema],

  stats: {
    totalRecharges:  { type: Number, default: 0 },
    totalSpent:      { type: Number, default: 0 },
    tripCount:       { type: Number, default: 0 },
    lastRecharge:    { type: Date },
    lastTransaction: { type: Date }
  },

  status: {
    type: String,
    enum: ['active', 'suspended', 'closed'],
    default: 'active'
  },

  lowBalanceThreshold: {
    type: Number,
    default: 10
  }
}, {
  timestamps: true,
  toJSON:   { getters: true },
  toObject: { getters: true }
});

virtualWalletSchema.index({ userId: 1, status: 1 });
virtualWalletSchema.index({ 'transactions.timestamp': -1 });

// Pre-save — generate card number on first save
// Uses async without next — same pattern as User.js to avoid "next is not a function"
virtualWalletSchema.pre('save', async function () {
  if (!this.cardNumber && this.isNew) {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    this.cardNumber = `01-${randomNum}`;
  }
});

virtualWalletSchema.methods.hasSufficientBalance = function (amount) {
  return this.balance >= amount;
};

virtualWalletSchema.methods.recharge = async function (amount, description = 'Wallet recharge') {
  if (amount <= 0)              throw new Error('Recharge amount must be positive');
  if (this.status !== 'active') throw new Error('Wallet is not active');

  this.balance += amount;
  this.transactions.push({
    type: 'recharge',
    amount,
    description,
    status: 'completed',
    balanceAfter: this.balance,
    timestamp: new Date()
  });
  this.stats.totalRecharges += amount;
  this.stats.lastRecharge    = new Date();
  this.stats.lastTransaction = new Date();

  await this.save();
  return this;
};

virtualWalletSchema.methods.deductFare = async function (amount, routeNumber, fromStop, toStop) {
  if (amount <= 0)                        throw new Error('Deduction amount must be positive');
  if (this.status !== 'active')           throw new Error('Wallet is not active');
  if (!this.hasSufficientBalance(amount)) throw new Error('Insufficient balance');

  this.balance -= amount;
  this.transactions.push({
    type: 'deduction',
    amount,
    description: `${routeNumber} fare: ${fromStop} to ${toStop}`,
    routeInfo: { routeNumber, fromStop, toStop },
    status: 'completed',
    balanceAfter: this.balance,
    timestamp: new Date()
  });
  this.stats.totalSpent      += amount;
  this.stats.tripCount       += 1;
  this.stats.lastTransaction  = new Date();

  await this.save();
  return this;
};

virtualWalletSchema.methods.refund = async function (transactionId, reason) {
  const transaction = this.transactions.id(transactionId);
  if (!transaction)                    throw new Error('Transaction not found');
  if (transaction.status === 'refunded') throw new Error('Transaction already refunded');
  if (transaction.type !== 'deduction')  throw new Error('Only deductions can be refunded');

  this.balance += transaction.amount;
  transaction.status = 'refunded';
  this.transactions.push({
    type: 'refund',
    amount: transaction.amount,
    description: `Refund: ${transaction.description} - ${reason}`,
    status: 'completed',
    balanceAfter: this.balance,
    timestamp: new Date()
  });
  this.stats.totalSpent      -= transaction.amount;
  this.stats.lastTransaction  = new Date();

  await this.save();
  return this;
};

virtualWalletSchema.methods.getTransactionHistory = function (limit = 10, skip = 0) {
  return this.transactions
    .slice()
    .reverse()
    .slice(skip, skip + limit);
};

virtualWalletSchema.methods.isBalanceLow = function () {
  return this.balance < this.lowBalanceThreshold;
};

virtualWalletSchema.statics.findLowBalance = function (threshold = 10) {
  return this.find({ balance: { $lt: threshold }, status: 'active' })
    .populate('userId', 'name email');
};

virtualWalletSchema.statics.findByUserId = function (userId) {
  return this.findOne({ userId, status: 'active' });
};

const VirtualWallet = mongoose.model('VirtualWallet', virtualWalletSchema);

export default VirtualWallet;