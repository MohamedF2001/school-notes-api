import Subject from "../models/Subject.js";

const createSubject = async (req, res, next) => {
  try {
    const { nom, description, coefficient } = req.body;

    if (!nom) {
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: [{ field: "nom", message: "Le nom de la matière est obligatoire" }],
      });
    }

    const subject = await Subject.create({
      nom,
      description,
      coefficient: coefficient || 1,
    });

    console.log("📚 Matière créée :", subject.nom);

    return res.status(201).json({
      success: true,
      message: "Matière créée avec succès",
      data: subject,
    });
  } catch (error) {
    next(error);
  }
};

const getSubjects = async (req, res, next) => {
  try {
    const { active, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (active !== undefined) filter.actif = active === "true";

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 20, 1);

    const total = await Subject.countDocuments(filter);
    const subjects = await Subject.find(filter)
      .sort({ nom: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      message: "Matières récupérées avec succès",
      data: subjects,
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

const getSubjectById = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Matière introuvable",
        error: `Aucune matière trouvée avec l'identifiant ${req.params.id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Matière récupérée avec succès",
      data: subject,
    });
  } catch (error) {
    next(error);
  }
};

const updateSubject = async (req, res, next) => {
  try {
    const { nom, description, coefficient, actif } = req.body;

    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Matière introuvable",
        error: `Aucune matière trouvée avec l'identifiant ${req.params.id}`,
      });
    }

    if (nom !== undefined) subject.nom = nom;
    if (description !== undefined) subject.description = description;
    if (coefficient !== undefined) subject.coefficient = coefficient;
    if (actif !== undefined) subject.actif = actif;

    await subject.save();

    console.log("📚 Matière modifiée :", subject.nom);

    return res.status(200).json({
      success: true,
      message: "Matière modifiée avec succès",
      data: subject,
    });
  } catch (error) {
    next(error);
  }
};

const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Matière introuvable",
        error: `Aucune matière trouvée avec l'identifiant ${req.params.id}`,
      });
    }

    subject.actif = false;
    await subject.save();

    console.log("📚 Matière désactivée :", subject.nom);

    return res.status(200).json({
      success: true,
      message: "Matière désactivée avec succès",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export { createSubject, getSubjects, getSubjectById, updateSubject, deleteSubject };
