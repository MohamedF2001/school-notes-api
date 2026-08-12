import jwt from "jsonwebtoken";
import User from "../models/User.js";

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise",
        error: "Token JWT manquant",
      });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Authentification invalide",
        error: "Token JWT invalide ou expiré",
      });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentification invalide",
        error: "Utilisateur introuvable",
      });
    }

    if (!user.actif) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé",
        error: "Ce compte a été désactivé",
      });
    }

    req.user = user;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Authentification invalide",
      error: error.message,
    });
  }
};

const verifyDirector = (req, res, next) => {
  if (!req.user || req.userRole !== "director") {
    return res.status(403).json({
      success: false,
      message: "Accès refusé",
      error: "Cette action est réservée au directeur",
    });
  }
  next();
};

const verifyTeacher = (req, res, next) => {
  if (!req.user || req.userRole !== "teacher") {
    return res.status(403).json({
      success: false,
      message: "Accès refusé",
      error: "Cette action est réservée aux professeurs",
    });
  }
  next();
};

const verifyDirectorOrTeacher = (req, res, next) => {
  if (!req.user || !["director", "teacher"].includes(req.userRole)) {
    return res.status(403).json({
      success: false,
      message: "Accès refusé",
      error: "Cette action est réservée au directeur ou aux professeurs",
    });
  }
  next();
};

export { verifyToken, verifyDirector, verifyTeacher, verifyDirectorOrTeacher };
