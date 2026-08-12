import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom est obligatoire"],
      trim: true,
    },
    prenom: {
      type: String,
      required: [true, "Le prénom est obligatoire"],
      trim: true,
    },
    dateNaissance: {
      type: Date,
      default: null,
    },
    sexe: {
      type: String,
      enum: {
        values: ["M", "F"],
        message: "Le sexe doit être 'M' ou 'F'",
      },
      default: null,
    },
    classe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "La classe est obligatoire"],
    },
    matricule: {
      type: String,
      required: [true, "Le matricule est obligatoire"],
      unique: true,
      trim: true,
    },
    parents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Parent",
      },
    ],
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

const Student = mongoose.model("Student", studentSchema);

export default Student;
