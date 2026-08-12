import mongoose from "mongoose";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const validateObjectIdParam = (paramName = "id") => {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (!isValidObjectId(value)) {
      return res.status(400).json({
        success: false,
        message: "Identifiant invalide",
        error: `Le paramètre '${paramName}' doit être un ObjectId MongoDB valide`,
      });
    }
    next();
  };
};

const validateGradePayload = (req, res, next) => {
  const errors = [];
  const { student, subject, class: classId, semester, type, numero, note, bareme } = req.body;

  if (!student || !isValidObjectId(student)) {
    errors.push({ field: "student", message: "L'identifiant de l'élève est invalide ou manquant" });
  }

  if (!subject || !isValidObjectId(subject)) {
    errors.push({ field: "subject", message: "L'identifiant de la matière est invalide ou manquant" });
  }

  if (!classId || !isValidObjectId(classId)) {
    errors.push({ field: "class", message: "L'identifiant de la classe est invalide ou manquant" });
  }

  const semesterNum = Number(semester);
  if (![1, 2].includes(semesterNum)) {
    errors.push({ field: "semester", message: "Le semestre doit être 1 ou 2" });
  }

  if (!["interrogation", "devoir"].includes(type)) {
    errors.push({ field: "type", message: "Le type doit être 'interrogation' ou 'devoir'" });
  }

  const numeroNum = Number(numero);
  if (type === "interrogation" && ![1, 2, 3].includes(numeroNum)) {
    errors.push({ field: "numero", message: "Le numéro d'une interrogation doit être 1, 2 ou 3" });
  }
  if (type === "devoir" && ![1, 2].includes(numeroNum)) {
    errors.push({ field: "numero", message: "Le numéro d'un devoir doit être 1 ou 2" });
  }

  const noteNum = Number(note);
  const baremeNum = bareme !== undefined ? Number(bareme) : 20;

  if (Number.isNaN(noteNum) || noteNum < 0) {
    errors.push({ field: "note", message: "La note doit être un nombre positif ou nul" });
  }

  if (Number.isNaN(baremeNum) || baremeNum <= 0 || baremeNum > 100) {
    errors.push({ field: "bareme", message: "Le barème doit être compris entre 0 (exclu) et 100" });
  }

  if (!Number.isNaN(noteNum) && !Number.isNaN(baremeNum) && noteNum > baremeNum) {
    errors.push({ field: "note", message: "La note ne peut pas être supérieure au barème" });
  }

  if (!req.body.anneeScolaire || typeof req.body.anneeScolaire !== "string") {
    errors.push({ field: "anneeScolaire", message: "L'année scolaire est obligatoire" });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Données invalides",
      errors,
    });
  }

  next();
};

export { isValidObjectId, validateObjectIdParam, validateGradePayload };
