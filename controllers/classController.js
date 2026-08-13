import Class from "../models/Class.js";
import Student from "../models/Student.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import Subject from "../models/Subject.js";
import Grade from "../models/Grade.js";
import {
  buildStudentResults,
  computeClassAverage,
} from "../utils/calculateResults.js";

const createClass = async (req, res, next) => {
  try {
    const { nom, niveau, description, anneeScolaire } = req.body;

    if (!nom || !anneeScolaire) {
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: [
          { field: "nom", message: "Le nom de la classe est obligatoire" },
          {
            field: "anneeScolaire",
            message: "L'année scolaire est obligatoire",
          },
        ].filter((e) => !req.body[e.field]),
      });
    }

    const newClass = await Class.create({
      nom,
      niveau,
      description,
      anneeScolaire,
    });

    console.log("📚 Classe créée :", newClass.nom);

    return res.status(201).json({
      success: true,
      message: "Classe créée avec succès",
      data: newClass,
    });
  } catch (error) {
    next(error);
  }
};

const getClasses = async (req, res, next) => {
  try {
    const { active, anneeScolaire, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (active !== undefined) filter.actif = active === "true";
    if (anneeScolaire) filter.anneeScolaire = anneeScolaire;

    console.log("📚 getClasses filter:", filter);

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 20, 1);

    const total = await Class.countDocuments(filter);
    const classes = await Class.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      message: "Classes récupérées avec succès",
      data: classes,
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

const getClassById = async (req, res, next) => {
  try {
    const classe = await Class.findById(req.params.id);

    if (!classe) {
      return res.status(404).json({
        success: false,
        message: "Classe introuvable",
        error: `Aucune classe trouvée avec l'identifiant ${req.params.id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Classe récupérée avec succès",
      data: classe,
    });
  } catch (error) {
    next(error);
  }
};

const updateClass = async (req, res, next) => {
  try {
    const { nom, niveau, description, anneeScolaire, actif } = req.body;

    const classe = await Class.findById(req.params.id);

    if (!classe) {
      return res.status(404).json({
        success: false,
        message: "Classe introuvable",
        error: `Aucune classe trouvée avec l'identifiant ${req.params.id}`,
      });
    }

    if (nom !== undefined) classe.nom = nom;
    if (niveau !== undefined) classe.niveau = niveau;
    if (description !== undefined) classe.description = description;
    if (anneeScolaire !== undefined) classe.anneeScolaire = anneeScolaire;
    if (actif !== undefined) classe.actif = actif;

    await classe.save();

    console.log("📚 Classe modifiée :", classe.nom);

    return res.status(200).json({
      success: true,
      message: "Classe modifiée avec succès",
      data: classe,
    });
  } catch (error) {
    next(error);
  }
};

const deleteClass = async (req, res, next) => {
  try {
    const classe = await Class.findById(req.params.id);

    if (!classe) {
      return res.status(404).json({
        success: false,
        message: "Classe introuvable",
        error: `Aucune classe trouvée avec l'identifiant ${req.params.id}`,
      });
    }

    classe.actif = false;
    await classe.save();

    console.log("📚 Classe désactivée :", classe.nom);

    return res.status(200).json({
      success: true,
      message: "Classe désactivée avec succès",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const getClassStudents = async (req, res, next) => {
  try {
    const classe = await Class.findById(req.params.id);

    if (!classe) {
      return res.status(404).json({
        success: false,
        message: "Classe introuvable",
        error: `Aucune classe trouvée avec l'identifiant ${req.params.id}`,
      });
    }

    const students = await Student.find({ classe: classe._id }).populate(
      "parents",
      "nom prenom telephone email",
    );

    return res.status(200).json({
      success: true,
      message: "Élèves de la classe récupérés avec succès",
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

const getClassTeachers = async (req, res, next) => {
  try {
    const classe = await Class.findById(req.params.id);

    if (!classe) {
      return res.status(404).json({
        success: false,
        message: "Classe introuvable",
        error: `Aucune classe trouvée avec l'identifiant ${req.params.id}`,
      });
    }

    const assignments = await TeacherAssignment.find({
      class: classe._id,
      actif: true,
    })
      .populate("teacher", "nom username telephone")
      .populate("subject", "nom coefficient");

    return res.status(200).json({
      success: true,
      message: "Professeurs de la classe récupérés avec succès",
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
};

const getClassResults = async (req, res, next) => {
  try {
    const classe = await Class.findById(req.params.id);

    if (!classe) {
      return res.status(404).json({
        success: false,
        message: "Classe introuvable",
        error: `Aucune classe trouvée avec l'identifiant ${req.params.id}`,
      });
    }

    const students = await Student.find({ classe: classe._id, actif: true });
    const subjects = await Subject.find({ actif: true }).sort({ nom: 1 });

    const studentsResults = await Promise.all(
      students.map(async (student) => {
        const grades = await Grade.find({
          student: student._id,
          anneeScolaire: classe.anneeScolaire,
        }).populate("subject", "nom coefficient");

        const semesters = buildStudentResults({ grades, subjects });

        return {
          student: {
            id: student._id,
            nom: student.nom,
            prenom: student.prenom,
            matricule: student.matricule,
          },
          semesters,
        };
      }),
    );

    const classAverages = {
      1: computeClassAverage(studentsResults, 1),
      2: computeClassAverage(studentsResults, 2),
    };

    return res.status(200).json({
      success: true,
      message: "Résultats de la classe récupérés avec succès",
      data: {
        class: {
          id: classe._id,
          nom: classe.nom,
          anneeScolaire: classe.anneeScolaire,
        },
        classAverages,
        students: studentsResults,
      },
    });
  } catch (error) {
    next(error);
  }
};

export {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass,
  getClassStudents,
  getClassTeachers,
  getClassResults,
};
