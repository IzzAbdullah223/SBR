import express from 'express';
import verifyToken from '../middlewares/verifyToken.js';
import { getWallet, rechargeWallet, getTransactions } from '../controllers/walletController.js';

const router = express.Router();

router.use(verifyToken);

router.get('/',            getWallet);
router.post('/recharge',   rechargeWallet);
router.get('/transactions',getTransactions);

export default router;