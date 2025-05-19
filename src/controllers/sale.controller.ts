import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Sale , Transaction , ISale, SaleStatus} from '../models/transaction.models'; 


export const createSale = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        const saleData: Partial<ISale> = { ...req.body, userId };

        if (saleData.subTotal === undefined || saleData.subTotal < 0) {
            return res.status(400).json({ message: "Subtotal is required and must be non-negative." });
        }
        if (saleData.totalAmountDue === undefined || saleData.totalAmountDue < 0) {
            return res.status(400).json({ message: "Total amount due is required and must be non-negative." });
        }

        const newSale = new Sale(saleData);
        const savedSale = await newSale.save();
        res.status(201).json(savedSale);
    } catch (error) {
        if (error instanceof Error && error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: (error as any).errors });
        }
        next(error);
    }
};

export const getAllSales = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }

        const {
            status,
            minTotalAmount,
            maxTotalAmount,
            startDate,
            endDate,
            finalized,
            refunded,
            page = 1,
            limit = 10,
            sortBy = 'saleDate',
            sortOrder = 'desc',
        } = req.query;

        const query: any = { userId: new mongoose.Types.ObjectId(userId as string) };

        if (status) query.status = status as SaleStatus;
        if (finalized !== undefined) query.finalized = finalized === 'true';
        if (refunded !== undefined) query.refunded = refunded === 'true';

        if (startDate || endDate) {
            query.saleDate = {};
            if (startDate) query.saleDate.$gte = new Date(startDate as string);
            if (endDate) query.saleDate.$lte = new Date(endDate as string);
        }
        
        if (minTotalAmount || maxTotalAmount) {
            query.totalAmountDue = {};
            if (minTotalAmount) query.totalAmountDue.$gte = parseFloat(minTotalAmount as string);
            if (maxTotalAmount) query.totalAmountDue.$lte = parseFloat(maxTotalAmount as string);
        }

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        const sortOptions: { [key: string]: 1 | -1 } = {};
        sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

        const sales = await Sale.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum)
            .populate('paymentTransactions', 'amount date status type'); 

        const totalSales = await Sale.countDocuments(query);

        res.status(200).json({
            data: sales,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalSales / limitNum),
                totalItems: totalSales,
                itemsPerPage: limitNum,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getSaleById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const saleId = req.params.id;
        const userId = (req as any).user?.id;

        if (!mongoose.Types.ObjectId.isValid(saleId)) {
            return res.status(400).json({ message: 'Invalid Sale ID format.' });
        }

        const sale = await Sale.findById(saleId).populate('paymentTransactions', 'amount date status type');
        
        if (!sale) {
            return res.status(404).json({ message: 'Sale not found.' });
        }

        if (userId && sale.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Forbidden: You do not have access to this sale.' });
        }

        res.status(200).json(sale);
    } catch (error) {
        if (error instanceof Error && error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID format.' });
        }
        next(error);
    }
};

export const updateSale = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const saleId = req.params.id;
        const userId = (req as any).user?.id;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(saleId)) {
            return res.status(400).json({ message: 'Invalid Sale ID format.' });
        }

        const originalSale = await Sale.findById(saleId);
        if (!originalSale) {
            return res.status(404).json({ message: 'Sale not found.' });
        }

        if (userId && originalSale.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Forbidden: You cannot update this sale.' });
        }
        
        if (updateData.userId && updateData.userId !== originalSale.userId.toString()) {
            return res.status(400).json({ message: "Cannot change the sale's user." });
        }

        // If paymentTransactions are being updated, ensure they are valid transaction IDs
        if (updateData.paymentTransactions) {
            for (const txId of updateData.paymentTransactions) {
                if (!mongoose.Types.ObjectId.isValid(txId)) {
                    return res.status(400).json({ message: `Invalid payment transaction ID: ${txId}` });
                }
                const transaction = await Transaction.findById(txId);
                if (!transaction || transaction.userId.toString() !== userId) {
                     return res.status(400).json({ message: `Payment transaction ${txId} not found or not accessible.` });
                }
            }
        }
        
        // Recalculate amountPaid if status changes or paymentTransactions are modified
        // This logic can become complex and might be better suited for a service layer or model methods.
        // For example, if status is 'PAID', amountPaid should equal totalAmountDue.
        // If paymentTransactions are updated, amountPaid should be sum of amounts of COMPLETED payment transactions.
        // For now, we allow direct update of amountPaid, but this is a simplification.
        // if (updateData.paymentTransactions && !updateData.amountPaid) {
        //    // Logic to sum up amounts from valid payment transactions
        // }


        const updatedSale = await Sale.findByIdAndUpdate(
            saleId,
            updateData,
            { new: true, runValidators: true }
        ).populate('paymentTransactions', 'amount date status type');

        if (!updatedSale) {
            return res.status(404).json({ message: 'Sale not found or update failed.' });
        }
        res.status(200).json(updatedSale);
    } catch (error) {
        if (error instanceof Error && error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: (error as any).errors });
        }
        if (error instanceof Error && error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID format in request.' });
        }
        next(error);
    }
};

export const deleteSale = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const saleId = req.params.id;
        const userId = (req as any).user?.id;

        if (!mongoose.Types.ObjectId.isValid(saleId)) {
            return res.status(400).json({ message: 'Invalid Sale ID format.' });
        }

        const sale = await Sale.findById(saleId);
        if (!sale) {
            return res.status(404).json({ message: 'Sale not found.' });
        }

        if (userId && sale.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Forbidden: You cannot delete this sale.' });
        }

        // Considerations for deleting a sale:
        // - What happens to associated paymentTransactions? Should they be unlinked or deleted?
        // - If the sale is 'PAID' or 'PARTIALLY_PAID', deleting it might require complex accounting adjustments.
        // - Soft delete (setting a flag like 'isDeleted') is often preferred for financial records.
        // For this controller, we perform a hard delete.

        // Example: If you want to disassociate transactions but not delete them:
        // await Transaction.updateMany({ _id: { $in: sale.paymentTransactions } }, { $unset: { saleIdField: "" } }); // if you had a saleIdField in Transaction

        await Sale.findByIdAndDelete(saleId);
        res.status(200).json({ message: 'Sale deleted successfully.' });
    } catch (error) {
        if (error instanceof Error && error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID format.' });
        }
        next(error);
    }
};
