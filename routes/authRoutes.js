import express from "express";
import rateLimit from "express-rate-limit";
import {
  directorLogin,
  teacherLogin,
  getProfile,
  changePassword,
} from "../controllers/authController.js";
import { verifyToken } from "../middlewares/auth.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Trop de tentatives de connexion",
    error: "Veuillez réessayer plus tard",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/director/login", loginLimiter, directorLogin);
router.post("/teacher/login", loginLimiter, teacherLogin);
router.get("/profile", verifyToken, getProfile);
router.put("/change-password", verifyToken, changePassword);

export default router;
