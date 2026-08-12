import mongoose from "mongoose";

const parentAccessTokenSchema = new mongoose.Schema(
  {
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
      required: [true, "Le parent est obligatoire"],
    },
    token: {
      type: String,
      required: [true, "Le token est obligatoire"],
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    revoked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const ParentAccessToken = mongoose.model(
  "ParentAccessToken",
  parentAccessTokenSchema
);

export default ParentAccessToken;
