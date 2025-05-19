import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Transaction , TransactionStatus , TransactionType , TransactionCategory , ITransaction } from '../models/transaction.models'; 
import Account from '../models/accounts.models'; 

export const createTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id; 
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        const { accountId, amount, currency, type } = req.body;

        const account = await Account.findById(accountId);
        if (!account) {
            return res.status(404).json({ message: 'Account not found.' });
        }
        if (account.userId?.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Forbidden: You do not own this account.' });
        }

        if (account.currency !== currency) {
            return res.status(400).json({ 
                message: `Transaction currency (${currency}) does not match account currency (${account.currency}).` 
            });
        }

        const transactionData: Partial<ITransaction> = { ...req.body, userId };
        const newTransaction = new Transaction(transactionData);
        const savedTransaction = await newTransaction.save(); 

        res.status(201).json(savedTransaction);
    } catch (error) {
        if (error instanceof Error && error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: (error as any).errors });
        }
         if ((error as any).code === 11000 && (error as any).keyPattern?.transactionRef) {
            return res.status(409).json({ message: 'Transaction with this reference ID already exists.' });
        }
        next(error);
    }
};

export const getAllTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }

        const {
            accountId,
            type,
            status,
            category,
            startDate,
            endDate,
            minAmount,
            maxAmount,
            isRecurring,
            page = 1,
            limit = 10,
            sortBy = 'date',
            sortOrder = 'desc', 
        } = req.query;

        const query: any = { userId: new mongoose.Types.ObjectId(userId as string) };

        if (accountId) query.accountId = new mongoose.Types.ObjectId(accountId as string);
        if (type) query.type = type as TransactionType;
        if (status) query.status = status as TransactionStatus;
        if (category) query.category = category as TransactionCategory;
        if (isRecurring !== undefined) query.isRecurring = isRecurring === 'true';

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate as string);
            if (endDate) query.date.$lte = new Date(endDate as string);
        }
        if (minAmount || maxAmount) {
            query.amount = {};
            if (minAmount) query.amount.$gte = parseFloat(minAmount as string);
            if (maxAmount) query.amount.$lte = parseFloat(maxAmount as string);
        }
        
        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        const sortOptions: { [key: string]: 1 | -1 } = {};
        sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
        
        const transactions = await Transaction.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum)
            .populate('accountId', 'name type currency');

        const totalTransactions = await Transaction.countDocuments(query);

        res.status(200).json({
            data: transactions,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalTransactions / limitNum),
                totalItems: totalTransactions,
                itemsPerPage: limitNum,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getTransactionById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const transactionId = req.params.id;
        const userId = (req as any).user?.id;

        if (!mongoose.Types.ObjectId.isValid(transactionId)) {
            return res.status(400).json({ message: 'Invalid Transaction ID format.' });
        }

        const transaction = await Transaction.findById(transactionId).populate('accountId', 'name type currency');
        
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found.' });
        }

        if (userId && transaction.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Forbidden: You do not have access to this transaction.' });
        }

        res.status(200).json(transaction);
    } catch (error) {
        if (error instanceof Error && error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID format.' });
        }
        next(error);
    }
};

// only update the transaction status 
export const updateTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const transactionId = req.params.id;
        const userId = (req as any).user?.id;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(transactionId)) {
            return res.status(400).json({ message: 'Invalid Transaction ID format.' });
        }

        const originalTransaction = await Transaction.findById(transactionId);

        if (!originalTransaction) {
            return res.status(404).json({ message: 'Transaction not found.' });
        }

        if (userId && originalTransaction.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Forbidden: You cannot update this transaction.' });
        }
        
        // If accountId is changed, re-validate ownership of the new account
        if (updateData.accountId && updateData.accountId !== originalTransaction.accountId.toString()) {
            const newAccount = await Account.findById(updateData.accountId);
            if (!newAccount) return res.status(404).json({ message: 'New account not found.' });
            if (newAccount.userId?.toString() !== userId.toString()) {
                return res.status(403).json({ message: 'Forbidden: You do not own the new target account.' });
            }
            if (newAccount.currency !== (updateData.currency || originalTransaction.currency)) {
                return res.status(400).json({ message: 'Currency mismatch with the new account.' });
            }
        }
        
        // Prevent changing userId
        if (updateData.userId && updateData.userId !== originalTransaction.userId.toString()) {
            return res.status(400).json({ message: "Cannot change the transaction's user." });
        }


        const updatedTransaction = await Transaction.findByIdAndUpdate(
            transactionId,
            updateData,
            { new: true, runValidators: true }
        ).populate('accountId', 'name type currency');

        if (!updatedTransaction) {
            return res.status(404).json({ message: 'Transaction not found or update failed.' });
        }
        // Todo: Account balance recalculation here
        res.status(200).json(updatedTransaction);
    } catch (error) {
        if (error instanceof Error && error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: (error as any).errors });
        }
        if (error instanceof Error && error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID format in request.' });
        }
         if ((error as any).code === 11000 && (error as any).keyPattern?.transactionRef) {
            return res.status(409).json({ message: 'Transaction with this reference ID already exists.' });
        }
        next(error);
    }
};

