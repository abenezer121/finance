import mongoose, {Document , ObjectId} from 'mongoose'

export enum AccountType {
    CHECKING = 'Checking',
    SAVINGS = 'Savings',
    CREDIT_CARD = 'Credit Card',
    CASH = 'Cash',
    LOAN = 'Loan',
    INVESTMENT = 'Investment',
    OTHER = 'Other',
}

export enum SyncStatus {
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
    ERROR = 'error',
    PENDING = 'pending',
}


export interface IAccount extends Document {
    name: string;
    type: AccountType;
    currentBalance: number;
    currency: string;
    userId?: ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}



