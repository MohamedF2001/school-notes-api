import mongoose from "mongoose";

const gradeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "L'élève est obligatoire"],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "La matière est obligatoire"],
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "La classe est obligatoire"],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Le professeur est obligatoire"],
    },
    semester: {
      type: Number,
      required: [true, "Le semestre est obligatoire"],
      enum: {
        values: [1, 2],
        message: "Le semestre doit être 1 ou 2",
      },
    },
    type: {
      type: String,
      required: [true, "Le type d'évaluation est obligatoire"],
      enum: {
        values: ["interrogation", "devoir"],
        message: "Le type doit être 'interrogation' ou 'devoir'",
      },
    },
    numero: {
      type: Number,
      required: [true, "Le numéro de l'évaluation est obligatoire"],
    },
    note: {
      type: Number,
      required: [true, "La note est obligatoire"],
      min: [0, "La note ne peut pas être négative"],
    },
    bareme: {
      type: Number,
      required: true,
      default: 20,
      min: [0.01, "Le barème doit être supérieur à 0"],
      max: [100, "Le barème ne peut pas dépasser 100"],
    },
    anneeScolaire: {
      type: String,
      required: [true, "L'année scolaire est obligatoire"],
      trim: true,
    },
    commentaire: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

gradeSchema.pre("validate", function (next) {
  if (this.type === "interrogation" && ![1, 2, 3].includes(this.numero)) {
    return next(
      new Error("Le numéro d'une interrogation doit être 1, 2 ou 3")
    );
  }

  if (this.type === "devoir" && ![1, 2].includes(this.numero)) {
    return next(new Error("Le numéro d'un devoir doit être 1 ou 2"));
  }

  if (this.note > this.bareme) {
    return next(
      new Error("La note ne peut pas être supérieure au barème")
    );
  }

  next();
});

gradeSchema.index(
  { student: 1, subject: 1, semester: 1, type: 1, numero: 1, anneeScolaire: 1 },
  { unique: true }
);

const Grade = mongoose.model("Grade", gradeSchema);

export default Grade;
