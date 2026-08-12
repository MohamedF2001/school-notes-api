import express from "express";
import {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass,
  getClassStudents,
  getClassTeachers,
  getClassResults,
} from "../controllers/classController.js";
import { verifyToken, verifyDirector, verifyDirectorOrTeacher } from "../middlewares/auth.js";
import { validateObjectIdParam } from "../middlewares/validate.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", verifyDirectorOrTeacher, getClasses);
router.get("/:id", validateObjectIdParam("id"), verifyDirectorOrTeacher, getClassById);
router.post("/", verifyDirector, createClass);
router.put("/:id", validateObjectIdParam("id"), verifyDirector, updateClass);
router.delete("/:id", validateObjectIdParam("id"), verifyDirector, deleteClass);
router.get(
  "/:id/students",
  validateObjectIdParam("id"),
  verifyDirectorOrTeacher,
  getClassStudents
);
router.get(
  "/:id/teachers",
  validateObjectIdParam("id"),
  verifyDirectorOrTeacher,
  getClassTeachers
);
router.get(
  "/:id/results",
  validateObjectIdParam("id"),
  verifyDirectorOrTeacher,
  getClassResults
);

export default router;
