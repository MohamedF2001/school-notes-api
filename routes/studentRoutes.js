import express from "express";
import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentResults,
  getStudentGrades,
} from "../controllers/studentController.js";
import { verifyToken, verifyDirector, verifyDirectorOrTeacher } from "../middlewares/auth.js";
import { validateObjectIdParam } from "../middlewares/validate.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", verifyDirectorOrTeacher, getStudents);
router.get("/:id", validateObjectIdParam("id"), verifyDirectorOrTeacher, getStudentById);
router.post("/", verifyDirector, createStudent);
router.put("/:id", validateObjectIdParam("id"), verifyDirector, updateStudent);
router.delete("/:id", validateObjectIdParam("id"), verifyDirector, deleteStudent);
router.get(
  "/:id/results",
  validateObjectIdParam("id"),
  verifyDirectorOrTeacher,
  getStudentResults
);
router.get(
  "/:id/grades",
  validateObjectIdParam("id"),
  verifyDirectorOrTeacher,
  getStudentGrades
);

export default router;
