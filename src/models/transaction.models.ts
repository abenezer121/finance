import mongoose , {Schema , Model , Document, Types} from "mongoose"

export enum TransactionType {
    INCOME = 'income',
    EXPENSE = 'expense',
    TRANSFER = 'transfer' // movement of funds between users own account
}

export enum TransactionStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
    REFUNDED = 'refunded'
}

export enum PaymentMethodType {
    CASH = 'cash',
    BANK_TRANSFER = 'bank_transfer',
    ONLINE_GATEWAY='online_gateway', // e.g chapa , telebirr
    OTHER = 'other'
}

export enum SaleStatus {
    PENDING = 'pending',
    PARTIALLY_PAID = 'partially_paid',
    PAID = 'paid',
    OVERDUE = 'overdue',
    CANCELLED = 'cancelled',
    REFUNDED = 'refunded'
}

export enum RecurrenceFrequency {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
    QUARTERLY = 'quarterly',
    ANNUALLY = 'annually',
}

export enum TransactionCategory {
    SALARY = 'SALARY',
    UTILITIES = 'UTILITIES',
    RENT = 'RENT',
    GROCERIES = 'GROCERIES',
    TRANSPORTATION = 'TRANSPORTATION',
    HEALTHCARE = 'HEALTHCARE',
    ENTERTAINMENT = 'ENTERTAINMENT',
    SAVINGS = 'SAVINGS',
    DEBT_PAYMENT = 'DEBT_PAYMENT',
    INVESTMENT = 'INVESTMENT',
    SALES = 'SALES',
    SALARIES_PAID = 'SALARIES_PAID', 
    OTHER = 'OTHER',
 
}

export interface ITransaction extends Document {
    userId : Types.ObjectId,
    accountId : Types.ObjectId,
    type: TransactionType
    amount: number;
    currency: string;
    date: Date;
    description?: string;
    category?: TransactionCategory;
    status: TransactionStatus;
    paymentMethod?: PaymentMethodType;
    transactionRef?: string; // External reference ID
    relatedTransactionId?: Types.ObjectId; // For transfers, links to the corresponding transaction in the other account
    tags?: string[]; 
    isRecurring: boolean; // Is this a recurring transaction?
    recurrenceDetails?: { // Details if it's a recurring transaction
        frequency: RecurrenceFrequency;
        endDate?: Date;
        nextDueDate?: Date;
    };
    attachments?: { url: string; filename: string }[]; // For receipts, invoices, etc.
    createdAt: Date;
    updatedAt: Date;
}

export interface ISale extends Document {
    userId: Types.ObjectId; 
    subTotal: number; 
    discount?: { 
        description?: string;
        amount?: number;      
        percentage?: number;  
    };
    taxAmount: number;
    totalAmountDue: number;
    amountPaid: number; 
    status: SaleStatus;
    paymentTransactions: Types.ObjectId[]; // Array of Transaction IDs representing payments for this sale
    notes?: string;
    saleDate: Date; // Date the sale was made
    dueDate?: Date; // Optional due date for payment
    finalized: boolean; 
    refunded: boolean;
    createdAt: Date;
    updatedAt: Date;

    // taxRef?: Types.ObjectId; 
    // taxGroupRef?: Types.ObjectId;

}


const transactionSchema: Schema<ITransaction> = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    type: {
        type: String,
        enum: Object.values(TransactionType),
        required: [true, 'Transaction type is required.'],
    },
    amount: {
        type: Number,
        required: [true, 'Transaction amount is required.'],
        min: [0.01, 'Transaction amount must be positive.'], // Amount is always positive; type determines effect
    },
    currency: {
        type: String,
        required: [true, 'Currency is required.'],
        uppercase: true,
        trim: true,
    },
    date: {
        type: Date,
        default: Date.now,
        required: [true, 'Transaction date is required.'],
    },
    description: {
        type: String,
        trim: true,
    },
    category: { 
        type: Object.values(TransactionCategory),
        trim: true,
        index: true,
    },
    status: {
        type: String,
        enum: Object.values(TransactionStatus),
        default: TransactionStatus.COMPLETED,
        required: [true, 'Transaction status is required.'],
    },
    paymentMethod: {
        type: String,
        enum: Object.values(PaymentMethodType),
    },
    transactionRef: { 
        type: String,
        trim: true,
        unique: true,
        sparse: true,
    },
    relatedTransactionId: { 
        type: Schema.Types.ObjectId,
        ref: 'Transaction',
    },
    tags: [{ type: String, trim: true }],
    isRecurring: {
        type: Boolean,
        default: false,
    },
    recurrenceDetails: {
        frequency: { type: Object.values(RecurrenceFrequency)},
        endDate: { type: Date },
        nextDueDate: {type: Date },
    },
    attachments: [{
        url: { type: String, required: true },
        filename: { type: String, required: true },
    }],
}, { timestamps: true });


transactionSchema.post('save' , async function(doc : ITransaction){
    const Account = mongoose.model<any>('Account'); 
    const account = await Account.findById(doc.accountId);
    
    if (account && doc.status === TransactionStatus.COMPLETED) {
        let impact = 0;
        if (doc.type === TransactionType.INCOME) {
            impact = doc.amount;
        } else if (doc.type === TransactionType.EXPENSE) {
           impact = -doc.amount;
       }

       if (impact !== 0) {
            if (account.currency === doc.currency) {
                account.currentBalance += impact;
                await account.save();
            } else {
                console.warn(`Currency mismatch for transaction ${doc._id} and account ${account._id}. Balance not updated.`);
              
            }
       }
    }
})

const saleSchema: Schema<ISale> = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
   
  
    subTotal: { type: Number, required: true, min: 0 },
    discount: {
        description: { type: String, trim: true },
        amount: { type: Number, min: 0 },
        percentage: { type: Number, min: 0, max: 100 },
    },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmountDue: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    status: {
        type: String,
        enum: Object.values(SaleStatus),
        default: SaleStatus.PENDING,
        required: [true, 'Sale status is required.'],
    },
    paymentTransactions: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }],
    notes: { type: String, trim: true },
    saleDate: { type: Date, default: Date.now, required: true },
    dueDate: { type: Date },
    finalized: { type: Boolean, default: false },
    refunded: { type: Boolean, default: false },
    // creditId: { type: Schema.Types.ObjectId, ref: 'Credit', unique: true, sparse: true },
    // taxRef: { type: Schema.Types.ObjectId, ref: 'Tax' },
    // taxGroupRef: { type: Schema.Types.ObjectId, ref: 'TaxGroup' },
}, { timestamps: true });


export const Transaction: Model<ITransaction> = mongoose.model<ITransaction>('Transaction', transactionSchema);
export const Sale: Model<ISale> = mongoose.model<ISale>('Sale', saleSchema);

export default { Transaction , Sale}