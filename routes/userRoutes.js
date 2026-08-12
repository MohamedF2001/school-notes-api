import express from "express";
import {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  resetTeacherPassword,
  getTeacherAssignments,
} from "../controllers/userController.js";
import { verifyToken, verifyDirector } from "../middlewares/auth.js";
import { validateObjectIdParam } from "../middlewares/validate.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", verifyDirector, getTeachers);
router.get("/:id", validateObjectIdParam("id"), verifyDirector, getTeacherById);
router.post("/", verifyDirector, createTeacher);
router.put("/:id", validateObjectIdParam("id"), verifyDirector, updateTeacher);
router.delete("/:id", validateObjectIdParam("id"), verifyDirector, deleteTeacher);
router.put(
  "/:id/password",
  validateObjectIdParam("id"),
  verifyDirector,
  resetTeacherPassword
);
router.get(
  "/:id/assignments",
  validateObjectIdParam("id"),
  verifyDirector,
  getTeacherAssignments
);

export default router;
