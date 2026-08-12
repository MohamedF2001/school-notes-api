import Student from "../models/Student.js";
import Class from "../models/Class.js";
import Parent from "../models/Parent.js";
import Grade from "../models/Grade.js";
import Subject from "../models/Subject.js";
import { buildStudentResults } from "../utils/calculateResults.js";

const createStudent = async (req, res, next) => {
  try {
    const { nom, prenom, dateNaissance, sexe, classe, matricule, parents, anneeScolaire } = req.body;

    if (!nom || !prenom || !classe || !matricule || !anneeScolaire) {
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: [
          { field: "nom", message: "Le nom est obligatoire" },
          { field: "prenom", message: "Le prénom est obligatoire" },
          { field: "classe", message: "La classe est obligatoire" },
          { field: "matricule", message: "Le matricule est obligatoire" },
          { field: "anneeScolaire", message: "L'année scolaire est obligatoire" },
        ].filter((e) => !req.body[e.field]),
      });
    }

    const classDoc = await Class.findById(classe);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Classe introuvable",
        error: `Aucune classe trouvée avec l'identifiant ${classe}`,
      });
    }

    const student = await Student.create({
      nom,
      prenom,
      dateNaissance,
      sexe,
      classe,
      matricule,
      parents: parents || [],
      anneeScolaire,
    });

    if (parents && parents.length > 0) {
      await Parent.updateMany(
        { _id: { $in: parents } },
        { $addToSet: { enfants: student._id } }
      );
    }

    console.log("🎓 Élève créé :", student.nom, student.prenom);

    return res.status(201).json({
      success: true,
      message: "Élève créé avec succès",
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

const getStudents = async (req, res, next) => {
  try {
    const { classId, active, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (classId) filter.classe = classId;
    if (active !== undefined) filter.actif = active === "true";

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 20, 1);

    const total = await Student.countDocuments(filter);
    const students = await Student.find(filter)
      .populate("classe", "nom niveau")
      .populate("parents", "nom prenom telephone email")
      .sort({ nom: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      message: "Élèves récupérés avec succès",
      data: students,
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

const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate("classe", "nom niveau")
      .populate("parents", "nom prenom telephone email");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Élève introuvable",
        error: `Aucun élève trouvé avec l'identifiant ${req.params.id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Élève récupéré avec succès",
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

const updateStudent = async (req, res, next) => {
  try {
    const { nom, prenom, dateNaissance, sexe, classe, matricule, parents, anneeScolaire, actif } = req.body;

    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Élève introuvable",
        error: `Aucun élève trouvé avec l'identifiant ${req.params.id}`,
      });
    }

    if (classe !== undefined) {
      const classDoc = await Class.findById(classe);
      if (!classDoc) {
        return res.status(404).json({
          success: false,
          message: "Classe introuvable",
          error: `Aucune classe trouvée avec l'identifiant ${classe}`,
        });
      }
      student.classe = classe;
    }

    if (nom !== undefined) student.nom = nom;
    if (prenom !== undefined) student.prenom = prenom;
    if (dateNaissance !== undefined) student.dateNaissance = dateNaissance;
    if (sexe !== undefined) student.sexe = sexe;
    if (matricule !== undefined) student.matricule = matricule;
    if (anneeScolaire !== undefined) student.anneeScolaire = anneeScolaire;
    if (actif !== undefined) student.actif = actif;

    if (parents !== undefined) {
      await Parent.updateMany(
        { _id: { $in: student.parents } },
        { $pull: { enfants: student._id } }
      );
      student.parents = parents;
      await Parent.updateMany(
        { _id: { $in: parents } },
        { $addToSet: { enfants: student._id } }
      );
    }

    await student.save();

    console.log("🎓 Élève modifié :", student.nom, student.prenom);

    return res.status(200).json({
      success: true,
      message: "Élève modifié avec succès",
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Élève introuvable",
        error: `Aucun élève trouvé avec l'identifiant ${req.params.id}`,
      });
    }

    if (req.query.hard === "true") {
      await Parent.updateMany(
        { _id: { $in: student.parents } },
        { $pull: { enfants: student._id } }
      );
      await student.deleteOne();
      console.log("🎓 Élève supprimé définitivement :", req.params.id);
    } else {
      student.actif = false;
      await student.save();
      console.log("🎓 Élève désactivé :", student.nom, student.prenom);
    }

    return res.status(200).json({
      success: true,
      message: "Élève supprimé avec succès",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const getStudentResults = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate("classe", "nom niveau anneeScolaire");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Élève introuvable",
        error: `Aucun élève trouvé avec l'identifiant ${req.params.id}`,
      });
    }

    const subjects = await Subject.find({ actif: true }).sort({ nom: 1 });

    const grades = await Grade.find({
      student: student._id,
      anneeScolaire: student.anneeScolaire,
    }).populate("subject", "nom coefficient");

    const semesters = buildStudentResults({ grades, subjects });

    return res.status(200).json({
      success: true,
      message: "Résultats de l'élève récupérés avec succès",
      data: {
        student: {
          id: student._id,
          nom: student.nom,
          prenom: student.prenom,
          classe: student.classe?.nom || null,
        },
        semesters,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getStudentGrades = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Élève introuvable",
        error: `Aucun élève trouvé avec l'identifiant ${req.params.id}`,
      });
    }

    const filter = { student: student._id };
    if (req.query.semester) filter.semester = Number(req.query.semester);
    if (req.query.subjectId) filter.subject = req.query.subjectId;

    const grades = await Grade.find(filter)
      .populate("subject", "nom coefficient")
      .populate("teacher", "nom username")
      .sort({ semester: 1, type: 1, numero: 1 });

    return res.status(200).json({
      success: true,
      message: "Notes de l'élève récupérées avec succès",
      data: grades,
    });
  } catch (error) {
    next(error);
  }
};

export {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentResults,
  getStudentGrades,
};
