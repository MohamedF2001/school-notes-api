import express from "express";
import {
  getSubjectResults,
  getTeacherResults,
  getSemesterResults,
} from "../controllers/resultController.js";
import { verifyToken, verifyDirector, verifyDirectorOrTeacher } from "../middlewares/auth.js";
import { validateObjectIdParam } from "../middlewares/validate.js";

const router = express.Router();

router.use(verifyToken);

router.get(
  "/subject/:id",
  validateObjectIdParam("id"),
  verifyDirectorOrTeacher,
  getSubjectResults
);
router.get(
  "/teacher/:id",
  validateObjectIdParam("id"),
  verifyDirectorOrTeacher,
  getTeacherResults
);
router.get("/semester/:semester", verifyDirectorOrTeacher, getSemesterResults);

export default router;
