import { Schema, model, Document } from 'mongoose';
import type { IUser } from '@vedaai/shared';
export interface IUserDocument extends Omit<IUser, '_id'>, Document {
}
const UserSchema = new Schema<IUserDocument>({
    name: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 100,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        default: null,
    },
    schoolName: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    googleId: {
        type: String,
        default: null,
    },
    avatar: {
        type: String,
        default: null,
    },
}, { timestamps: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ googleId: 1 }, { sparse: true });
export const User = model<IUserDocument>('User', UserSchema);
