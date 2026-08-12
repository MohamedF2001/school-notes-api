import express from "express";
import {
  createGrade,
  getGrades,
  getGradeById,
  updateGrade,
  deleteGrade,
  getGradesByStudent,
  getGradesByClass,
  getGradesBySubject,
  getGradesBySemester,
} from "../controllers/gradeController.js";
import { verifyToken, verifyDirectorOrTeacher } from "../middlewares/auth.js";
import { validateObjectIdParam, validateGradePayload } from "../middlewares/validate.js";

const router = express.Router();

router.use(verifyToken, verifyDirectorOrTeacher);

router.get("/", getGrades);
router.get("/student/:studentId", validateObjectIdParam("studentId"), getGradesByStudent);
router.get("/class/:classId", validateObjectIdParam("classId"), getGradesByClass);
router.get("/subject/:subjectId", validateObjectIdParam("subjectId"), getGradesBySubject);
router.get("/semester/:semester", getGradesBySemester);
router.get("/:id", validateObjectIdParam("id"), getGradeById);
router.post("/", validateGradePayload, createGrade);
router.put("/:id", validateObjectIdParam("id"), updateGrade);
router.delete("/:id", validateObjectIdParam("id"), deleteGrade);

export default router;
