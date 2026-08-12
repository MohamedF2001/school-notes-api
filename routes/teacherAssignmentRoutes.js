import express from "express";
import {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
} from "../controllers/teacherAssignmentController.js";
import { verifyToken, verifyDirector, verifyDirectorOrTeacher } from "../middlewares/auth.js";
import { validateObjectIdParam } from "../middlewares/validate.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", verifyDirectorOrTeacher, getAssignments);
router.get("/:id", validateObjectIdParam("id"), verifyDirectorOrTeacher, getAssignmentById);
router.post("/", verifyDirector, createAssignment);
router.put("/:id", validateObjectIdParam("id"), verifyDirector, updateAssignment);
router.delete("/:id", validateObjectIdParam("id"), verifyDirector, deleteAssignment);

export default router;
