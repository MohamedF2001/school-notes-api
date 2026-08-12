import Parent from "../models/Parent.js";
import Student from "../models/Student.js";
import ParentAccessToken from "../models/ParentAccessToken.js";
import Subject from "../models/Subject.js";
import Grade from "../models/Grade.js";
import generateParentToken from "../utils/generateParentToken.js";
import { buildStudentResults } from "../utils/calculateResults.js";

const createParent = async (req, res, next) => {
  try {
    const { nom, prenom, telephone, email, adresse, enfants } = req.body;

    if (!nom || !prenom) {
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: [
          { field: "nom", message: "Le nom est obligatoire" },
          { field: "prenom", message: "Le prénom est obligatoire" },
        ].filter((e) => !req.body[e.field]),
      });
    }

    const parent = await Parent.create({
      nom,
      prenom,
      telephone,
      email,
      adresse,
      enfants: enfants || [],
    });

    if (enfants && enfants.length > 0) {
      await Student.updateMany(
        { _id: { $in: enfants } },
        { $addToSet: { parents: parent._id } }
      );
    }

    console.log("👨‍👩‍👧 Parent créé :", parent.nom, parent.prenom);

    return res.status(201).json({
      success: true,
      message: "Parent créé avec succès",
      data: parent,
    });
  } catch (error) {
    next(error);
  }
};

const getParents = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 20, 1);

    const total = await Parent.countDocuments({});
    const parents = await Parent.find({})
      .populate("enfants", "nom prenom matricule")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      message: "Parents récupérés avec succès",
      data: parents,
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

const getParentById = async (req, res, next) => {
  try {
    const parent = await Parent.findById(req.params.id).populate(
      "enfants",
      "nom prenom matricule classe"
    );

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent introuvable",
        error: `Aucun parent trouvé avec l'identifiant ${req.params.id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Parent récupéré avec succès",
      data: parent,
    });
  } catch (error) {
    next(error);
  }
};

const updateParent = async (req, res, next) => {
  try {
    const { nom, prenom, telephone, email, adresse, enfants, actif } = req.body;

    const parent = await Parent.findById(req.params.id);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent introuvable",
        error: `Aucun parent trouvé avec l'identifiant ${req.params.id}`,
      });
    }

    if (nom !== undefined) parent.nom = nom;
    if (prenom !== undefined) parent.prenom = prenom;
    if (telephone !== undefined) parent.telephone = telephone;
    if (email !== undefined) parent.email = email;
    if (adresse !== undefined) parent.adresse = adresse;
    if (actif !== undefined) parent.actif = actif;

    if (enfants !== undefined) {
      await Student.updateMany(
        { _id: { $in: parent.enfants } },
        { $pull: { parents: parent._id } }
      );
      parent.enfants = enfants;
      await Student.updateMany(
        { _id: { $in: enfants } },
        { $addToSet: { parents: parent._id } }
      );
    }

    await parent.save();

    console.log("👨‍👩‍👧 Parent modifié :", parent.nom, parent.prenom);

    return res.status(200).json({
      success: true,
      message: "Parent modifié avec succès",
      data: parent,
    });
  } catch (error) {
    next(error);
  }
};

const deleteParent = async (req, res, next) => {
  try {
    const parent = await Parent.findById(req.params.id);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent introuvable",
        error: `Aucun parent trouvé avec l'identifiant ${req.params.id}`,
      });
    }

    parent.actif = false;
    await parent.save();

    await ParentAccessToken.updateMany(
      { parent: parent._id },
      { revoked: true }
    );

    console.log("👨‍👩‍👧 Parent désactivé :", parent.nom, parent.prenom);

    return res.status(200).json({
      success: true,
      message: "Parent désactivé avec succès",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const generateAccessLink = async (req, res, next) => {
  try {
    const parent = await Parent.findById(req.params.id);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent introuvable",
        error: `Aucun parent trouvé avec l'identifiant ${req.params.id}`,
      });
    }

    const { expiresInDays } = req.body;

    const token = generateParentToken();

    let expiresAt = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(expiresInDays));
    }

    const accessToken = await ParentAccessToken.create({
      parent: parent._id,
      token,
      expiresAt,
    });

    console.log("🔑 Lien parent généré pour :", parent.nom, parent.prenom);

    return res.status(201).json({
      success: true,
      message: "Lien de consultation généré avec succès",
      data: {
        id: accessToken._id,
        token: accessToken.token,
        expiresAt: accessToken.expiresAt,
        createdAt: accessToken.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAccessLinks = async (req, res, next) => {
  try {
    const parent = await Parent.findById(req.params.id);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent introuvable",
        error: `Aucun parent trouvé avec l'identifiant ${req.params.id}`,
      });
    }

    const tokens = await ParentAccessToken.find({ parent: parent._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Liens de consultation récupérés avec succès",
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
};

const revokeAccessLink = async (req, res, next) => {
  try {
    const { id, tokenId } = req.params;

    const accessToken = await ParentAccessToken.findOne({
      _id: tokenId,
      parent: id,
    });

    if (!accessToken) {
      return res.status(404).json({
        success: false,
        message: "Lien de consultation introuvable",
        error: `Aucun lien trouvé avec l'identifiant ${tokenId} pour ce parent`,
      });
    }

    accessToken.revoked = true;
    await accessToken.save();

    console.log("🔑 Lien parent révoqué :", tokenId);

    return res.status(200).json({
      success: true,
      message: "Lien de consultation révoqué avec succès",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const getPublicParentResults = async (req, res, next) => {
  try {
    const { token } = req.params;

    const accessToken = await ParentAccessToken.findOne({ token });

    if (!accessToken) {
      return res.status(404).json({
        success: false,
        message: "Lien invalide",
        error: "Aucun lien de consultation ne correspond à ce token",
      });
    }

    if (accessToken.revoked) {
      return res.status(403).json({
        success: false,
        message: "Lien révoqué",
        error: "Ce lien de consultation a été révoqué par le directeur",
      });
    }

    if (accessToken.expiresAt && new Date() > new Date(accessToken.expiresAt)) {
      return res.status(403).json({
        success: false,
        message: "Lien expiré",
        error: "Ce lien de consultation a expiré",
      });
    }

    const parent = await Parent.findById(accessToken.parent).populate({
      path: "enfants",
      populate: { path: "classe", select: "nom niveau anneeScolaire" },
    });

    if (!parent || !parent.actif) {
      return res.status(404).json({
        success: false,
        message: "Parent introuvable",
        error: "Le compte parent associé à ce lien est introuvable ou désactivé",
      });
    }

    const subjects = await Subject.find({ actif: true }).sort({ nom: 1 });

    const children = await Promise.all(
      parent.enfants
        .filter((child) => child.actif)
        .map(async (child) => {
          const grades = await Grade.find({
            student: child._id,
            anneeScolaire: child.anneeScolaire,
          }).populate("subject", "nom coefficient");

          const semesters = buildStudentResults({ grades, subjects });

          return {
            id: child._id,
            nom: child.nom,
            prenom: child.prenom,
            classe: child.classe ? child.classe.nom : null,
            anneeScolaire: child.anneeScolaire,
            semesters,
          };
        })
    );

    return res.status(200).json({
      success: true,
      message: "Résultats récupérés avec succès",
      data: {
        parent: {
          nom: parent.nom,
          prenom: parent.prenom,
        },
        children,
      },
    });
  } catch (error) {
    next(error);
  }
};

export {
  createParent,
  getParents,
  getParentById,
  updateParent,
  deleteParent,
  generateAccessLink,
  getAccessLinks,
  revokeAccessLink,
  getPublicParentResults,
};
