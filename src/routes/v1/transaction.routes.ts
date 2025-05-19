import express from 'express';
import {  getTransactionById , getAllTransactions  } from '../../controllers/transaction.controller';

const router = express.Router();


router.post('/', (req , res , next)=>{
    getTransactionById(req, res , next).catch(next)
});

router.get('/:id', (req , res,  next)=>{
    getAllTransactions(req , res , next).catch(next)
});


export default router;

