import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri?.startsWith("mongodb://") && !uri?.startsWith("mongodb+srv://")) {
  throw new Error("MONGODB_URI must be set to a MongoDB connection URI");
}

const connection = await mongoose
  .createConnection(uri, { maxPoolSize: 2 })
  .asPromise();
try {
  const definitions = [
    ["users", { emailNormalized: 1 }, { unique: true }],
    ["sessions", { tokenHash: 1 }, { unique: true }],
    ["sessions", { expiresAt: 1 }, { expireAfterSeconds: 0 }],
    ["sessions", { userId: 1 }, {}],
    ["passwordResetTokens", { tokenHash: 1 }, { unique: true }],
    ["passwordResetTokens", { expiresAt: 1 }, { expireAfterSeconds: 0 }],
    ["passwordResetTokens", { userId: 1 }, {}],
    [
      "rateLimitBuckets",
      { bucketKeyHash: 1, action: 1, windowStart: 1 },
      { unique: true },
    ],
    ["rateLimitBuckets", { expiresAt: 1 }, { expireAfterSeconds: 0 }],
    ["weddingMembers", { userId: 1 }, { unique: true }],
    ["weddingMembers", { weddingId: 1, userId: 1 }, { unique: true }],
    ["weddingMembers", { weddingId: 1, role: 1 }, {}],
  ];

  for (const [collectionName, keys, options] of definitions) {
    await connection.db.collection(collectionName).createIndex(keys, options);
  }
  console.info("Authentication indexes are ready");
} finally {
  await connection.close();
}
