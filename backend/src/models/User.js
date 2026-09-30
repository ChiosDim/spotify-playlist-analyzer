import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Store only what we need from Spotify. The refresh token is sensitive:
 * in production, encrypt it at rest (e.g. with a KMS-backed field).
 * For learning, we store it as-is but never log it.
 */
const userSchema = new Schema(
  {
    spotifyId: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, default: "" },
    email: { type: String, default: "" },
    country: { type: String, default: "" },
    product: { type: String, default: "" }, // "free" | "premium"
    profileImage: { type: String, default: "" },
    followers: { type: Number, default: 0 },

    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

/**
 * True if the access token is expired (with a 60-second safety margin).
 */
userSchema.methods.isTokenExpired = function () {
  return Date.now() >= this.expiresAt.getTime() - 60_000;
};

/**
 * Update tokens after a refresh.
 */
userSchema.methods.updateTokens = async function ({ accessToken, refreshToken, expiresIn }) {
  this.accessToken = accessToken;
  if (refreshToken) this.refreshToken = refreshToken;
  this.expiresAt = new Date(Date.now() + expiresIn * 1000);
  await this.save();
};

export default model("User", userSchema);
