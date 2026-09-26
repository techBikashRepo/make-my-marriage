import "server-only";

import mongoose, { Schema, type Model } from "mongoose";

export type UserRecord = {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  emailNormalized: string;
  passwordHash: string;
};
type SessionRecord = {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  lastSeenAt?: Date;
};
type ResetRecord = {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
};
type RateLimitRecord = {
  bucketKeyHash: string;
  action: string;
  windowStart: Date;
  count: number;
  expiresAt: Date;
};
type MembershipRecord = {
  weddingId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: "ADMIN" | "MANAGER";
  joinedAt: Date;
};

const modelOptions = { autoIndex: process.env.NODE_ENV !== "production" };

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    emailNormalized: { type: String, required: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true, ...modelOptions },
);
userSchema.index({ emailNormalized: 1 }, { unique: true });

const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    lastSeenAt: Date,
  },
  {
    collection: "sessions",
    timestamps: { createdAt: true, updatedAt: false },
    ...modelOptions,
  },
);
sessionSchema.index({ tokenHash: 1 }, { unique: true });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ userId: 1 });

const resetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    usedAt: Date,
  },
  {
    collection: "passwordResetTokens",
    timestamps: { createdAt: true, updatedAt: false },
    ...modelOptions,
  },
);
resetSchema.index({ tokenHash: 1 }, { unique: true });
resetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
resetSchema.index({ userId: 1 });

const rateLimitSchema = new Schema(
  {
    bucketKeyHash: { type: String, required: true },
    action: { type: String, required: true },
    windowStart: { type: Date, required: true },
    count: { type: Number, required: true },
    expiresAt: { type: Date, required: true },
  },
  { collection: "rateLimitBuckets", ...modelOptions },
);
rateLimitSchema.index(
  { bucketKeyHash: 1, action: 1, windowStart: 1 },
  { unique: true },
);
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const membershipSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, required: true },
    userId: { type: Schema.Types.ObjectId, required: true },
    role: { type: String, enum: ["ADMIN", "MANAGER"], required: true },
    joinedAt: { type: Date, required: true },
  },
  { collection: "weddingMembers", ...modelOptions },
);
membershipSchema.index({ userId: 1 }, { unique: true });
membershipSchema.index({ weddingId: 1, userId: 1 }, { unique: true });
membershipSchema.index({ weddingId: 1, role: 1 });

export const User: Model<UserRecord> =
  (mongoose.models.User as Model<UserRecord> | undefined) ??
  mongoose.model<UserRecord>("User", userSchema);
export const Session: Model<SessionRecord> =
  (mongoose.models.Session as Model<SessionRecord> | undefined) ??
  mongoose.model<SessionRecord>("Session", sessionSchema);
export const PasswordResetToken: Model<ResetRecord> =
  (mongoose.models.PasswordResetToken as Model<ResetRecord> | undefined) ??
  mongoose.model<ResetRecord>("PasswordResetToken", resetSchema);
export const RateLimitBucket: Model<RateLimitRecord> =
  (mongoose.models.RateLimitBucket as Model<RateLimitRecord> | undefined) ??
  mongoose.model<RateLimitRecord>("RateLimitBucket", rateLimitSchema);
export const WeddingMember: Model<MembershipRecord> =
  (mongoose.models.WeddingMember as Model<MembershipRecord> | undefined) ??
  mongoose.model<MembershipRecord>("WeddingMember", membershipSchema);
