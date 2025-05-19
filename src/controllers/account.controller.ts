import {Request , Response , NextFunction} from "express"
import {IAccount} from "../interfaces/financial.interfaces"
import Account from "../models/accounts.models"
import { Transaction } from "../models/transaction.models";

export const createAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.body.userId || (req as any).user?.id; 
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required to create an account.' });
        }

        const accountData: Partial<IAccount> = { ...req.body, userId };
        const newAccount = new Account(accountData);
        const savedAccount = await newAccount.save();
        res.status(201).json(savedAccount);
    } catch (error) {
        if (error instanceof Error && error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: (error as any).errors });
        }
        if ((error as any).code === 11000) { 
            return res.status(409).json({ message: 'Account with this name already exists for the user.' });
        }
        next(error); 
    }
};

export const  getAllAccoutns = async(req : Request , res : Response , next : NextFunction) => {
    try {
        const userId = (req as any).user?.id;
        const query = userId ? {userId} : {}
        const accounts = await Account.find(query)
        res.status(200).json(accounts)
    }catch(error) {
        next(error)
    }
}
export const getAccountById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accountId = req.params.id;
        const userId = (req as any).user?.id; 

        const account = await Account.findById(accountId);

        if (!account) {
            return res.status(404).json({ message: 'Account not found.' });
        }
        res.status(200).json(account);
    } catch (error) {
        if (error instanceof Error && error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Account ID format.' });
        }
        next(error);
    }
};

export const updateAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accountId = req.params.id;
        const userId = (req as any).user?.id;
        const { currentBalance, userId: bodyUserId, ...updateData } = req.body;

        if (bodyUserId && userId && bodyUserId.toString() !== userId.toString()) {
             return res.status(403).json({ message: 'Cannot change the owner of the account.' });
        }

        const account = await Account.findById(accountId);
        if (!account) {
            return res.status(404).json({ message: 'Account not found.' });
        }

        if (userId && account.userId?.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to update this account.' });
        }
        
        if (currentBalance !== undefined && currentBalance !== account.currentBalance) {
            console.warn(`Attempt to manually update balance for account ${accountId}. This should typically be done via transactions.`);
        }


        const updatedAccount = await Account.findByIdAndUpdate(
            accountId,
            { ...updateData, ...(currentBalance !== undefined && { currentBalance }) }, 
            { new: true, runValidators: true }
        );


        if (!updatedAccount) {
            return res.status(404).json({ message: 'Account not found or update failed.' });
        }
        res.status(200).json(updatedAccount);
    } catch (error) {
        if (error instanceof Error && error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: (error as any).errors });
        }
        if (error instanceof Error && error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Account ID format.' });
        }
        if ((error as any).code === 11000) {
             return res.status(409).json({ message: 'Update failed due to duplicate key (e.g. account name).' });
        }
        next(error);
    }
};

export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accountId = req.params.id;
        const userId = (req as any).user?.id; 

        const account = await Account.findById(accountId);
        if (!account) {
            return res.status(404).json({ message: 'Account not found.' });
        }

        if (userId && account.userId?.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this account.' });
        }

        // Todo prevent deletion if account has transaction or a non-zero balance 
        const transactionsExist = await Transaction.exists({ accountId: accountId });
        if (transactionsExist) {
            return res.status(400).json({ message: 'Cannot delete account with existing transactions. Please reassign or delete them first.' });
        }
        if (account.currentBalance !== 0) {
           return res.status(400).json({ message: 'Cannot delete account with a non-zero balance.'});
        }


        await Account.findByIdAndDelete(accountId);
        res.status(200).json({ message: 'Account deleted successfully.' });
    } catch (error) {
        if (error instanceof Error && error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Account ID format.' });
        }
        next(error);
    }
};
