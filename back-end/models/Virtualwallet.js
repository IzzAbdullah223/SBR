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
  // For trip-related transactions
  routeInfo: {
    routeNumber: String,
    fromStop: String,
    toStop: String
  },
  // Transaction status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  // Balance after transaction
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
  // Link to user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  // Current balance in AED
  balance: {
    type: Number,
    default: 0,
    min: 0,
    get: v => Math.round(v * 100) / 100, // Round to 2 decimal places
    set: v => Math.round(v * 100) / 100
  },
  
  // Virtual card number (for display)
  cardNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Transaction history
  transactions: [transactionSchema],
  
  // Wallet statistics
  stats: {
    totalRecharges: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    tripCount: {
      type: Number,
      default: 0
    },
    lastRecharge: {
      type: Date
    },
    lastTransaction: {
      type: Date
    }
  },
  
  // Wallet status
  status: {
    type: String,
    enum: ['active', 'suspended', 'closed'],
    default: 'active'
  },
  
  // Low balance threshold for notifications
  lowBalanceThreshold: {
    type: Number,
    default: 10
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Index for efficient queries
virtualWalletSchema.index({ userId: 1, status: 1 });
virtualWalletSchema.index({ 'transactions.timestamp': -1 });

// Pre-save middleware to generate card number if not exists
virtualWalletSchema.pre('save', function(next) {
  if (!this.cardNumber && this.isNew) {
    // Generate card number: 01-XXXXX (01 = bus card prefix)
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    this.cardNumber = `01-${randomNum}`;
  }
  next();
});

// Instance method to check if wallet has sufficient balance
virtualWalletSchema.methods.hasSufficientBalance = function(amount) {
  return this.balance >= amount;
};

// Instance method to recharge wallet
virtualWalletSchema.methods.recharge = async function(amount, description = 'Wallet recharge') {
  if (amount <= 0) {
    throw new Error('Recharge amount must be positive');
  }
  
  if (this.status !== 'active') {
    throw new Error('Wallet is not active');
  }
  
  // Update balance
  this.balance += amount;
  
  // Add transaction record
  this.transactions.push({
    type: 'recharge',
    amount: amount,
    description: description,
    status: 'completed',
    balanceAfter: this.balance,
    timestamp: new Date()
  });
  
  // Update stats
  this.stats.totalRecharges += amount;
  this.stats.lastRecharge = new Date();
  this.stats.lastTransaction = new Date();
  
  await this.save();
  return this;
};

// Instance method to deduct fare
virtualWalletSchema.methods.deductFare = async function(amount, routeNumber, fromStop, toStop) {
  if (amount <= 0) {
    throw new Error('Deduction amount must be positive');
  }
  
  if (this.status !== 'active') {
    throw new Error('Wallet is not active');
  }
  
  if (!this.hasSufficientBalance(amount)) {
    throw new Error('Insufficient balance');
  }
  
  // Update balance
  this.balance -= amount;
  
  // Add transaction record
  this.transactions.push({
    type: 'deduction',
    amount: amount,
    description: `${routeNumber} fare: ${fromStop} to ${toStop}`,
    routeInfo: {
      routeNumber,
      fromStop,
      toStop
    },
    status: 'completed',
    balanceAfter: this.balance,
    timestamp: new Date()
  });
  
  // Update stats
  this.stats.totalSpent += amount;
  this.stats.tripCount += 1;
  this.stats.lastTransaction = new Date();
  
  await this.save();
  return this;
};

// Instance method to refund a transaction
virtualWalletSchema.methods.refund = async function(transactionId, reason) {
  const transaction = this.transactions.id(transactionId);
  
  if (!transaction) {
    throw new Error('Transaction not found');
  }
  
  if (transaction.status === 'refunded') {
    throw new Error('Transaction already refunded');
  }
  
  if (transaction.type !== 'deduction') {
    throw new Error('Only deductions can be refunded');
  }
  
  // Update balance
  this.balance += transaction.amount;
  
  // Mark original transaction as refunded
  transaction.status = 'refunded';
  
  // Add refund transaction
  this.transactions.push({
    type: 'refund',
    amount: transaction.amount,
    description: `Refund: ${transaction.description} - ${reason}`,
    status: 'completed',
    balanceAfter: this.balance,
    timestamp: new Date()
  });
  
  // Update stats
  this.stats.totalSpent -= transaction.amount;
  this.stats.lastTransaction = new Date();
  
  await this.save();
  return this;
};

// Instance method to get transaction history
virtualWalletSchema.methods.getTransactionHistory = function(limit = 10, skip = 0) {
  return this.transactions
    .slice()
    .reverse() // Most recent first
    .slice(skip, skip + limit);
};

// Instance method to check if balance is low
virtualWalletSchema.methods.isBalanceLow = function() {
  return this.balance < this.lowBalanceThreshold;
};

// Static method to find wallets with low balance
virtualWalletSchema.statics.findLowBalance = function(threshold = 10) {
  return this.find({
    balance: { $lt: threshold },
    status: 'active'
  }).populate('userId', 'name email');
};

// Static method to get wallet by user ID
virtualWalletSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId, status: 'active' });
};

const VirtualWallet = mongoose.model('VirtualWallet', virtualWalletSchema);

export default VirtualWallet;