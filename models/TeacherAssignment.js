import mongoose from "mongoose";

const teacherAssignmentSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Le professeur est obligatoire"],
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "La classe est obligatoire"],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "La matière est obligatoire"],
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

teacherAssignmentSchema.index(
  { teacher: 1, class: 1, subject: 1, anneeScolaire: 1 },
  { unique: true }
);

const TeacherAssignment = mongoose.model(
  "TeacherAssignment",
  teacherAssignmentSchema
);

export default TeacherAssignment;
