import mongoose, { Schema, Model } from 'mongoose';
import { IAccount, AccountType, SyncStatus } from '../interfaces/financial.interfaces';


const accountSchema: Schema<IAccount> = new Schema({
    name: {
        type: String,
        required: [true, 'Account name is required.'],
        trim: true,
        unique: true,
    },
    type: {
        type: String,
        required: [true, 'Account type is required.'],
        enum: Object.values(AccountType),
        default: AccountType.CHECKING,
    },
    currentBalance: { // get the actual balance by calculating income/outcome
        type: Number,
        required: [true, 'Current balance is required.'],
        default: 0,
    },
    currency: {
        type: String,
        required: [true, 'Currency is required.'],
        default: 'ETB',
        uppercase: true,
        trim: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
   

}, { timestamps: true });

const Account: Model<IAccount> = mongoose.model<IAccount>('Account', accountSchema);

export default Account;