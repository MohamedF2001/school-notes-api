import "dotenv/config";
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js"; 
import User from "./models/User.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import classRoutes from "./routes/classRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import teacherAssignmentRoutes from "./routes/teacherAssignmentRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import parentRoutes from "./routes/parentRoutes.js";
import gradeRoutes from "./routes/gradeRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";

import { getPublicParentResults } from "./controllers/parentController.js";
import { getDashboard } from "./controllers/resultController.js";
import { verifyToken, verifyDirector } from "./middlewares/auth.js";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const swaggerPath = path.join(__dirname, "swagger.json");
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, "utf-8"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API de gestion des notes - École coranique",
    data: {
      documentation: "https://school-notes-api.vercel.app/api-docs",
    },
  });
}); 


app.use("/api/auth", authRoutes);
app.use("/api/teachers", userRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/assignments", teacherAssignmentRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/parents", parentRoutes);
app.use("/api/grades", gradeRoutes);
app.use("/api/results", resultRoutes);

app.get("/api/parent/public/:token", getPublicParentResults);
app.get("/api/dashboard", verifyToken, verifyDirector, getDashboard);

app.use(notFound);
app.use(errorHandler);

const createDefaultDirector = async () => {
  try {
    const existingDirector = await User.findOne({ role: "director" });

    if (existingDirector) {
      return;
    }

    const username = (process.env.DIRECTOR_USERNAME || "admin").toLowerCase();
    const password = process.env.DIRECTOR_PASSWORD || "admin";

    await User.create({
      username,
      password,
      nom: "Directeur",
      role: "director",
    });

    console.log(`👑 Compte directeur par défaut créé (${username})`);
  } catch (error) {
    console.error("❌ Erreur lors de la création du directeur par défaut :", error.message);
  }
};

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();
  await createDefaultDirector();

  if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📑 Documentation Swagger disponible sur /api-docs`);
    });
  }
};

startServer();

export default app;
