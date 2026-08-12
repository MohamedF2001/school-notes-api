import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom de la classe est obligatoire"],
      trim: true,
    },
    niveau: {
      type: String,
      trim: true,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    anneeScolaire: {
      type: String,
      required: [true, "L'année scolaire est obligatoire"],
      trim: true,
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

classSchema.index({ nom: 1, anneeScolaire: 1 }, { unique: true });

const Class = mongoose.model("Class", classSchema);

export default Class;
