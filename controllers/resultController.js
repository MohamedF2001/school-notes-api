import Student from "../models/Student.js";
import Subject from "../models/Subject.js";
import Class from "../models/Class.js";
import Grade from "../models/Grade.js";
import Parent from "../models/Parent.js";
import User from "../models/User.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import { buildStudentResults, computeClassAverage } from "../utils/calculateResults.js";

const getSubjectResults = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Matière introuvable",
        error: `Aucune matière trouvée avec l'identifiant ${req.params.id}`,
      });
    }

    const filter = { subject: subject._id };
    if (req.query.classId) filter.class = req.query.classId;
    if (req.query.semester) filter.semester = Number(req.query.semester);
    if (req.query.anneeScolaire) filter.anneeScolaire = req.query.anneeScolaire;

    const grades = await Grade.find(filter)
      .populate("student", "nom prenom matricule")
      .populate("class", "nom niveau")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Résultats de la matière récupérés avec succès",
      data: {
        subject: { id: subject._id, nom: subject.nom, coefficient: subject.coefficient },
        grades,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getTeacherResults = async (req, res, next) => {
  try {
    const teacher = await User.findOne({ _id: req.params.id, role: "teacher" });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Professeur introuvable",
        error: `Aucun professeur trouvé avec l'identifiant ${req.params.id}`,
      });
    }

    if (req.userRole === "teacher" && String(teacher._id) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé",
        error: "Vous ne pouvez consulter que vos propres résultats",
      });
    }

    const assignments = await TeacherAssignment.find({ teacher: teacher._id, actif: true })
      .populate("class", "nom niveau anneeScolaire")
      .populate("subject", "nom coefficient");

    const results = await Promise.all(
      assignments.map(async (assignment) => {
        const grades = await Grade.find({
          class: assignment.class._id,
          subject: assignment.subject._id,
          teacher: teacher._id,
        }).populate("student", "nom prenom matricule");

        return {
          class: assignment.class.nom,
          subject: assignment.subject.nom,
          totalGrades: grades.length,
          grades,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Résultats du professeur récupérés avec succès",
      data: {
        teacher: { id: teacher._id, nom: teacher.nom, username: teacher.username },
        assignments: results,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getSemesterResults = async (req, res, next) => {
  try {
    const semester = Number(req.params.semester);

    if (![1, 2].includes(semester)) {
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: [{ field: "semester", message: "Le semestre doit être 1 ou 2" }],
      });
    }

    const filter = {};
    if (req.query.classId) filter.classe = req.query.classId;
    if (req.query.anneeScolaire) filter.anneeScolaire = req.query.anneeScolaire;

    const students = await Student.find({ ...filter, actif: true }).populate(
      "classe",
      "nom niveau"
    );
    const subjects = await Subject.find({ actif: true }).sort({ nom: 1 });

    const results = await Promise.all(
      students.map(async (student) => {
        const grades = await Grade.find({
          student: student._id,
          semester,
          anneeScolaire: student.anneeScolaire,
        }).populate("subject", "nom coefficient");

        const semesters = buildStudentResults({ grades, subjects });

        return {
          student: {
            id: student._id,
            nom: student.nom,
            prenom: student.prenom,
            classe: student.classe?.nom || null,
          },
          result: semesters[semester],
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: `Résultats du semestre ${semester} récupérés avec succès`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const [classes, teachers, students, subjects, parents, gradesEntered] = await Promise.all([
      Class.countDocuments({ actif: true }),
      User.countDocuments({ role: "teacher", actif: true }),
      Student.countDocuments({ actif: true }),
      Subject.countDocuments({ actif: true }),
      Parent.countDocuments({ actif: true }),
      Grade.countDocuments({}),
    ]);

    const studentsByClassAgg = await Student.aggregate([
      { $match: { actif: true } },
      { $group: { _id: "$classe", count: { $sum: 1 } } },
    ]);

    const classDocs = await Class.find({ actif: true });
    const studentsByClass = classDocs.map((c) => {
      const found = studentsByClassAgg.find(
        (s) => String(s._id) === String(c._id)
      );
      return {
        class: c.nom,
        studentCount: found ? found.count : 0,
      };
    });

    const classAveragesData = await Promise.all(
      classDocs.map(async (classDoc) => {
        const studentsInClass = await Student.find({ classe: classDoc._id, actif: true });
        const subjectsList = await Subject.find({ actif: true });

        const studentsResults = await Promise.all(
          studentsInClass.map(async (student) => {
            const grades = await Grade.find({
              student: student._id,
              anneeScolaire: student.anneeScolaire,
            }).populate("subject", "nom coefficient");
            const semesters = buildStudentResults({ grades, subjects: subjectsList });
            return { semesters };
          })
        );

        return {
          class: classDoc.nom,
          averageSemester1: computeClassAverage(studentsResults, 1),
          averageSemester2: computeClassAverage(studentsResults, 2),
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Tableau de bord récupéré avec succès",
      data: {
        classes,
        teachers,
        students,
        subjects,
        parents,
        gradesEntered,
        studentsByClass,
        classAverages: classAveragesData,
      },
    });
  } catch (error) {
    next(error);
  }
};

export { getSubjectResults, getTeacherResults, getSemesterResults, getDashboard };
