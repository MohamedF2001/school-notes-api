import User from "../models/User.js";
import TeacherAssignment from "../models/TeacherAssignment.js";

const buildPagination = async (Model, filter, page, limit) => {
  const total = await Model.countDocuments(filter);
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    total,
    totalPages,
  };
};

const createTeacher = async (req, res, next) => {
  try {
    const { username, password, nom, telephone, matieres, classes } = req.body;

    if (!username || !password || !nom) {
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: [
          { field: "username", message: "L'identifiant est obligatoire" },
          { field: "password", message: "Le mot de passe est obligatoire" },
          { field: "nom", message: "Le nom est obligatoire" },
        ].filter((e) => !req.body[e.field]),
      });
    }

    const teacher = await User.create({
      username: username.toLowerCase(),
      password,
      nom,
      telephone: telephone || null,
      role: "teacher",
      matieres: matieres || [],
      classes: classes || [],
    });

    console.log("👨‍🏫 Professeur créé :", teacher.username);

    return res.status(201).json({
      success: true,
      message: "Professeur créé avec succès",
      data: teacher,
    });
  } catch (error) {
    next(error);
  }
};

const getTeachers = async (req, res, next) => {
  try {
    const { active, page = 1, limit = 20 } = req.query;
    const filter = { role: "teacher" };

    if (active !== undefined) {
      filter.actif = active === "true";
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 20, 1);

    const teachers = await User.find(filter)
      .populate("matieres", "nom coefficient")
      .populate("classes", "nom niveau")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const pagination = await buildPagination(User, filter, pageNum, limitNum);

    return res.status(200).json({
      success: true,
      message: "Professeurs récupérés avec succès",
      data: teachers,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getTeacherById = async (req, res, next) => {
  try {
    const teacher = await User.findOne({ _id: req.params.id, role: "teacher" })
      .populate("matieres", "nom coefficient")
      .populate("classes", "nom niveau");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Professeur introuvable",
        error: `Aucun professeur trouvé avec l'identifiant ${req.params.id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Professeur récupéré avec succès",
      data: teacher,
    });
  } catch (error) {
    next(error);
  }
};

const updateTeacher = async (req, res, next) => {
  try {
    const { nom, telephone, matieres, classes, actif, username } = req.body;

    const teacher = await User.findOne({ _id: req.params.id, role: "teacher" });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Professeur introuvable",
        error: `Aucun professeur trouvé avec l'identifiant ${req.params.id}`,
      });
    }

    if (username) teacher.username = username.toLowerCase();
    if (nom !== undefined) teacher.nom = nom;
    if (telephone !== undefined) teacher.telephone = telephone;
    if (matieres !== undefined) teacher.matieres = matieres;
    if (classes !== undefined) teacher.classes = classes;
    if (actif !== undefined) teacher.actif = actif;

    await teacher.save();

    console.log("👨‍🏫 Professeur modifié :", teacher.username);

    return res.status(200).json({
      success: true,
      message: "Professeur modifié avec succès",
      data: teacher,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTeacher = async (req, res, next) => {
  try {
    const teacher = await User.findOne({ _id: req.params.id, role: "teacher" });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Professeur introuvable",
        error: `Aucun professeur trouvé avec l'identifiant ${req.params.id}`,
      });
    }

    teacher.actif = false;
    await teacher.save();

    console.log("👨‍🏫 Professeur désactivé :", teacher.username);

    return res.status(200).json({
      success: true,
      message: "Professeur désactivé avec succès",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const resetTeacherPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: [
          { field: "newPassword", message: "Le nouveau mot de passe doit contenir au moins 4 caractères" },
        ],
      });
    }

    const teacher = await User.findOne({ _id: req.params.id, role: "teacher" });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Professeur introuvable",
        error: `Aucun professeur trouvé avec l'identifiant ${req.params.id}`,
      });
    }

    teacher.password = newPassword;
    await teacher.save();

    console.log("🔐 Mot de passe réinitialisé pour le professeur", teacher.username);

    return res.status(200).json({
      success: true,
      message: "Mot de passe réinitialisé avec succès",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const getTeacherAssignments = async (req, res, next) => {
  try {
    const teacher = await User.findOne({ _id: req.params.id, role: "teacher" });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Professeur introuvable",
        error: `Aucun professeur trouvé avec l'identifiant ${req.params.id}`,
      });
    }

    const assignments = await TeacherAssignment.find({ teacher: teacher._id })
      .populate("class", "nom niveau")
      .populate("subject", "nom coefficient");

    return res.status(200).json({
      success: true,
      message: "Affectations récupérées avec succès",
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
};

export {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  resetTeacherPassword,
  getTeacherAssignments,
};
