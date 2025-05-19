import express from 'express';
import { createSale , getSaleById , getAllSales , deleteSale , updateSale } from '../../controllers/sale.controller';

const router = express.Router();


router.post('/', (req , res , next)=>{
    createSale(req, res , next).catch(next)
});

router.get('/:id', (req , res,  next)=>{
    getSaleById(req , res , next).catch(next)
});

router.get('/', (req , res,  next)=>{
    getAllSales(req , res , next).catch(next)
});


router.put('/', (req , res,  next)=>{
    updateSale(req , res , next).catch(next)
});



router.delete('/', (req , res,  next)=>{
    deleteSale(req , res , next).catch(next)
});


export default router;

