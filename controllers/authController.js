import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

const directorLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: [
          { field: "username", message: "L'identifiant est obligatoire" },
          { field: "password", message: "Le mot de passe est obligatoire" },
        ].filter((e) =>
          e.field === "username" ? !username : !password
        ),
      });
    }

    const user = await User.findOne({
      username: username.toLowerCase(),
      role: "director",
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Identifiants incorrects",
        error: "Identifiant ou mot de passe invalide",
      });
    }

    if (!user.actif) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé",
        error: "Ce compte a été désactivé",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Identifiants incorrects",
        error: "Identifiant ou mot de passe invalide",
      });
    }

    const token = generateToken(user._id, user.role);

    console.log("🔐 Connexion réussie : directeur", user.username);

    return res.status(200).json({
      success: true,
      message: "Connexion réussie",
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          nom: user.nom,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const teacherLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: [
          { field: "username", message: "L'identifiant est obligatoire" },
          { field: "password", message: "Le mot de passe est obligatoire" },
        ].filter((e) =>
          e.field === "username" ? !username : !password
        ),
      });
    }

    const user = await User.findOne({
      username: username.toLowerCase(),
      role: "teacher",
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Identifiants incorrects",
        error: "Identifiant ou mot de passe invalide",
      });
    }

    if (!user.actif) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé",
        error: "Ce compte a été désactivé",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Identifiants incorrects",
        error: "Identifiant ou mot de passe invalide",
      });
    }

    const token = generateToken(user._id, user.role);

    console.log("🔐 Connexion réussie : professeur", user.username);

    return res.status(200).json({
      success: true,
      message: "Connexion réussie",
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          nom: user.nom,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("matieres", "nom coefficient")
      .populate("classes", "nom niveau");

    return res.status(200).json({
      success: true,
      message: "Profil récupéré avec succès",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: [
          { field: "currentPassword", message: "Le mot de passe actuel est obligatoire" },
          { field: "newPassword", message: "Le nouveau mot de passe est obligatoire" },
        ],
      });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: [
          { field: "newPassword", message: "Le nouveau mot de passe doit contenir au moins 4 caractères" },
        ],
      });
    }

    const user = await User.findById(req.user._id);

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Mot de passe actuel incorrect",
        error: "Le mot de passe actuel ne correspond pas",
      });
    }

    user.password = newPassword;
    await user.save();

    console.log("🔐 Mot de passe modifié pour l'utilisateur", user.username);

    return res.status(200).json({
      success: true,
      message: "Mot de passe modifié avec succès",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export { directorLogin, teacherLogin, getProfile, changePassword };
