import express from 'express';
import { createAccount , getAccountById , getAllAccoutns , deleteAccount , updateAccount } from '../../controllers/account.controller';

const router = express.Router();


router.post('/', (req , res , next)=>{
    createAccount(req, res , next).catch(next)
});

router.get('/:id', (req , res,  next)=>{
    getAccountById(req , res , next).catch(next)
});

router.get('/', (req , res,  next)=>{
    getAllAccoutns(req , res , next).catch(next)
});


router.put('/', (req , res,  next)=>{
    updateAccount(req , res , next).catch(next)
});



router.delete('/', (req , res,  next)=>{
    deleteAccount(req , res , next).catch(next)
});


export default router;

