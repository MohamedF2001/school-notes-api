import TeacherAssignment from "../models/TeacherAssignment.js";
import User from "../models/User.js";
import Class from "../models/Class.js";
import Subject from "../models/Subject.js";

const createAssignment = async (req, res, next) => {
  try {
    const { teacher, class: classId, subject, anneeScolaire } = req.body;

    if (!teacher || !classId || !subject || !anneeScolaire) {
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: [
          { field: "teacher", message: "Le professeur est obligatoire" },
          { field: "class", message: "La classe est obligatoire" },
          { field: "subject", message: "La matière est obligatoire" },
          { field: "anneeScolaire", message: "L'année scolaire est obligatoire" },
        ].filter((e) => !req.body[e.field]),
      });
    }

    const teacherDoc = await User.findOne({ _id: teacher, role: "teacher" });
    if (!teacherDoc) {
      return res.status(404).json({
        success: false,
        message: "Professeur introuvable",
        error: `Aucun professeur trouvé avec l'identifiant ${teacher}`,
      });
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Classe introuvable",
        error: `Aucune classe trouvée avec l'identifiant ${classId}`,
      });
    }

    const subjectDoc = await Subject.findById(subject);
    if (!subjectDoc) {
      return res.status(404).json({
        success: false,
        message: "Matière introuvable",
        error: `Aucune matière trouvée avec l'identifiant ${subject}`,
      });
    }

    const assignment = await TeacherAssignment.create({
      teacher,
      class: classId,
      subject,
      anneeScolaire,
    });

    await assignment.populate("teacher", "nom username");
    await assignment.populate("class", "nom niveau");
    await assignment.populate("subject", "nom coefficient");

    console.log(
      "📝 Affectation créée :",
      teacherDoc.nom,
      "->",
      classDoc.nom,
      "->",
      subjectDoc.nom
    );

    return res.status(201).json({
      success: true,
      message: "Affectation créée avec succès",
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

const getAssignments = async (req, res, next) => {
  try {
    const { teacher, class: classId, subject, anneeScolaire, active, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (teacher) filter.teacher = teacher;
    if (classId) filter.class = classId;
    if (subject) filter.subject = subject;
    if (anneeScolaire) filter.anneeScolaire = anneeScolaire;
    if (active !== undefined) filter.actif = active === "true";

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 20, 1);

    const total = await TeacherAssignment.countDocuments(filter);
    const assignments = await TeacherAssignment.find(filter)
      .populate("teacher", "nom username")
      .populate("class", "nom niveau")
      .populate("subject", "nom coefficient")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      message: "Affectations récupérées avec succès",
      data: assignments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await TeacherAssignment.findById(req.params.id)
      .populate("teacher", "nom username")
      .populate("class", "nom niveau")
      .populate("subject", "nom coefficient");

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Affectation introuvable",
        error: `Aucune affectation trouvée avec l'identifiant ${req.params.id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Affectation récupérée avec succès",
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

const updateAssignment = async (req, res, next) => {
  try {
    const { teacher, class: classId, subject, anneeScolaire, actif } = req.body;

    const assignment = await TeacherAssignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Affectation introuvable",
        error: `Aucune affectation trouvée avec l'identifiant ${req.params.id}`,
      });
    }

    if (teacher !== undefined) assignment.teacher = teacher;
    if (classId !== undefined) assignment.class = classId;
    if (subject !== undefined) assignment.subject = subject;
    if (anneeScolaire !== undefined) assignment.anneeScolaire = anneeScolaire;
    if (actif !== undefined) assignment.actif = actif;

    await assignment.save();
    await assignment.populate("teacher", "nom username");
    await assignment.populate("class", "nom niveau");
    await assignment.populate("subject", "nom coefficient");

    console.log("📝 Affectation modifiée :", assignment._id.toString());

    return res.status(200).json({
      success: true,
      message: "Affectation modifiée avec succès",
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

const deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await TeacherAssignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Affectation introuvable",
        error: `Aucune affectation trouvée avec l'identifiant ${req.params.id}`,
      });
    }

    await assignment.deleteOne();

    console.log("📝 Affectation supprimée :", req.params.id);

    return res.status(200).json({
      success: true,
      message: "Affectation supprimée avec succès",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
};
