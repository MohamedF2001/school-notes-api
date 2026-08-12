import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom de la matière est obligatoire"],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    coefficient: {
      type: Number,
      required: [true, "Le coefficient est obligatoire"],
      min: [1, "Le coefficient doit être au moins 1"],
      default: 1,
    },
    actif: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Subject = mongoose.model("Subject", subjectSchema);

export default Subject;
