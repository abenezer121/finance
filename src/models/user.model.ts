import mongoose, { Schema, Document, model } from "mongoose";

enum UserType {
    Individual = 'individual',
    Organization = 'organization'
}

interface User extends Document {
    id: string;
    email: string;
    phone?: string;
    userType: UserType;
    createdAt: Date;
    updatedAt: Date;

    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;

    organizationName?: string;
    contactPerson?: {
        name: string;
        email: string;
        phone?: string;
    };
}

const userSchema = new Schema<User>({
    id: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    userType: { type: String, enum: Object.values(UserType), required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },

    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    dateOfBirth: { type: String },

    organizationName: { type: String, trim: true },
    contactPerson: {
        name: { type: String, trim: true },
        email: { type: String, lowercase: true, trim: true },
        phone: { type: String, trim: true }
    }
});

userSchema.pre('save', function (next) {
    const user = this as User;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
        return next(new Error('Invalid email format'));
    }

    if (user.phone && !/^\+?[0-9]{10,15}$/.test(user.phone)) {
        return next(new Error('Invalid phone number format'));
    }

    user.updatedAt = new Date();

    if (user.userType === UserType.Individual) {
        if (!user.firstName || !user.lastName || !user.dateOfBirth) {
            return next(new Error('Missing required fields for individual user'));
        }
    } else if (user.userType === UserType.Organization) {
        if (!user.organizationName || !user.contactPerson?.name || !user.contactPerson?.email) {
            return next(new Error('Missing required fields for organization user'));
        }
    }

    next();
});

const User = model<User>('User', userSchema);

export { User, UserType };