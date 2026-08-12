import express from "express";
import {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
} from "../controllers/subjectController.js";
import { verifyToken, verifyDirector, verifyDirectorOrTeacher } from "../middlewares/auth.js";
import { validateObjectIdParam } from "../middlewares/validate.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", verifyDirectorOrTeacher, getSubjects);
router.get("/:id", validateObjectIdParam("id"), verifyDirectorOrTeacher, getSubjectById);
router.post("/", verifyDirector, createSubject);
router.put("/:id", validateObjectIdParam("id"), verifyDirector, updateSubject);
router.delete("/:id", validateObjectIdParam("id"), verifyDirector, deleteSubject);

export default router;
