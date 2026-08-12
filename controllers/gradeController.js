import Grade from "../models/Grade.js";
import Student from "../models/Student.js";
import Subject from "../models/Subject.js";
import Class from "../models/Class.js";
import TeacherAssignment from "../models/TeacherAssignment.js";

const ensureTeacherAssignment = async (teacherId, classId, subjectId) => {
  const assignment = await TeacherAssignment.findOne({
    teacher: teacherId,
    class: classId,
    subject: subjectId,
    actif: true,
  });
  return assignment;
};

const createGrade = async (req, res, next) => {
  try {
    const {
      student,
      subject,
      class: classId,
      semester,
      type,
      numero,
      note,
      bareme,
      anneeScolaire,
      commentaire,
    } = req.body;

    const studentDoc = await Student.findById(student);
    if (!studentDoc) {
      return res.status(404).json({
        success: false,
        message: "Élève introuvable",
        error: `Aucun élève trouvé avec l'identifiant ${student}`,
      });
    }

    if (String(studentDoc.classe) !== String(classId)) {
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        error: "L'élève n'appartient pas à la classe indiquée",
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

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Classe introuvable",
        error: `Aucune classe trouvée avec l'identifiant ${classId}`,
      });
    }

    let teacherId = req.body.teacher;

    if (req.userRole === "teacher") {
      teacherId = req.user._id;

      const assignment = await ensureTeacherAssignment(teacherId, classId, subject);

      if (!assignment) {
        console.log("⚠️ Accès refusé : professeur non affecté à cette classe/matière");
        return res.status(403).json({
          success: false,
          message: "Accès refusé",
          error: "Vous n'êtes pas affecté à cette classe pour cette matière",
        });
      }
    } else if (req.userRole === "director") {
      if (!teacherId) {
        return res.status(400).json({
          success: false,
          message: "Données invalides",
          errors: [{ field: "teacher", message: "Le professeur est obligatoire" }],
        });
      }
    }

    const grade = await Grade.create({
      student,
      subject,
      class: classId,
      teacher: teacherId,
      semester: Number(semester),
      type,
      numero: Number(numero),
      note: Number(note),
      bareme: bareme !== undefined ? Number(bareme) : 20,
      anneeScolaire,
      commentaire,
    });

    await grade.populate("subject", "nom coefficient");
    await grade.populate("class", "nom niveau");
    await grade.populate("teacher", "nom username");
    await grade.populate("student", "nom prenom matricule");

    console.log("📝 Note enregistrée pour l'élève", studentDoc.nom, studentDoc.prenom);

    return res.status(201).json({
      success: true,
      message: "Note enregistrée avec succès",
      data: grade,
    });
  } catch (error) {
    next(error);
  }
};

const getGrades = async (req, res, next) => {
  try {
    const { studentId, classId, subjectId, semester, type, anneeScolaire, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (studentId) filter.student = studentId;
    if (classId) filter.class = classId;
    if (subjectId) filter.subject = subjectId;
    if (semester) filter.semester = Number(semester);
    if (type) filter.type = type;
    if (anneeScolaire) filter.anneeScolaire = anneeScolaire;

    if (req.userRole === "teacher") {
      filter.teacher = req.user._id;
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 20, 1);

    const total = await Grade.countDocuments(filter);
    const grades = await Grade.find(filter)
      .populate("student", "nom prenom matricule")
      .populate("subject", "nom coefficient")
      .populate("class", "nom niveau")
      .populate("teacher", "nom username")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      message: "Notes récupérées avec succès",
      data: grades,
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

const getGradeById = async (req, res, next) => {
  try {
    const grade = await Grade.findById(req.params.id)
      .populate("student", "nom prenom matricule")
      .populate("subject", "nom coefficient")
      .populate("class", "nom niveau")
      .populate("teacher", "nom username");

    if (!grade) {
      return res.status(404).json({
        success: false,
        message: "Note introuvable",
        error: `Aucune note trouvée avec l'identifiant ${req.params.id}`,
      });
    }

    if (req.userRole === "teacher" && String(grade.teacher._id) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé",
        error: "Vous ne pouvez consulter que les notes que vous avez saisies",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Note récupérée avec succès",
      data: grade,
    });
  } catch (error) {
    next(error);
  }
};

const updateGrade = async (req, res, next) => {
  try {
    const grade = await Grade.findById(req.params.id);

    if (!grade) {
      return res.status(404).json({
        success: false,
        message: "Note introuvable",
        error: `Aucune note trouvée avec l'identifiant ${req.params.id}`,
      });
    }

    if (req.userRole === "teacher") {
      if (String(grade.teacher) !== String(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: "Accès refusé",
          error: "Vous ne pouvez modifier que les notes que vous avez saisies",
        });
      }

      const targetClass = req.body.class || grade.class;
      const targetSubject = req.body.subject || grade.subject;

      const assignment = await ensureTeacherAssignment(
        req.user._id,
        targetClass,
        targetSubject
      );

      if (!assignment) {
        return res.status(403).json({
          success: false,
          message: "Accès refusé",
          error: "Vous n'êtes pas affecté à cette classe pour cette matière",
        });
      }
    }

    const { note, bareme, commentaire, semester, type, numero } = req.body;

    if (note !== undefined) grade.note = Number(note);
    if (bareme !== undefined) grade.bareme = Number(bareme);
    if (commentaire !== undefined) grade.commentaire = commentaire;
    if (semester !== undefined) grade.semester = Number(semester);
    if (type !== undefined) grade.type = type;
    if (numero !== undefined) grade.numero = Number(numero);

    await grade.validate();
    await grade.save();

    await grade.populate("student", "nom prenom matricule");
    await grade.populate("subject", "nom coefficient");
    await grade.populate("class", "nom niveau");
    await grade.populate("teacher", "nom username");

    console.log("📝 Note modifiée :", grade._id.toString());

    return res.status(200).json({
      success: true,
      message: "Note modifiée avec succès",
      data: grade,
    });
  } catch (error) {
    next(error);
  }
};

const deleteGrade = async (req, res, next) => {
  try {
    const grade = await Grade.findById(req.params.id);

    if (!grade) {
      return res.status(404).json({
        success: false,
        message: "Note introuvable",
        error: `Aucune note trouvée avec l'identifiant ${req.params.id}`,
      });
    }

    if (req.userRole === "teacher" && String(grade.teacher) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé",
        error: "Vous ne pouvez supprimer que les notes que vous avez saisies",
      });
    }

    await grade.deleteOne();

    console.log("📝 Note supprimée :", req.params.id);

    return res.status(200).json({
      success: true,
      message: "Note supprimée avec succès",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const getGradesByStudent = async (req, res, next) => {
  req.query.studentId = req.params.studentId;
  return getGrades(req, res, next);
};

const getGradesByClass = async (req, res, next) => {
  req.query.classId = req.params.classId;
  return getGrades(req, res, next);
};

const getGradesBySubject = async (req, res, next) => {
  req.query.subjectId = req.params.subjectId;
  return getGrades(req, res, next);
};

const getGradesBySemester = async (req, res, next) => {
  req.query.semester = req.params.semester;
  return getGrades(req, res, next);
};

export {
  createGrade,
  getGrades,
  getGradeById,
  updateGrade,
  deleteGrade,
  getGradesByStudent,
  getGradesByClass,
  getGradesBySubject,
  getGradesBySemester,
};
