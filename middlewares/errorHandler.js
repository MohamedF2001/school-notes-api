const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route introuvable",
    error: `La route ${req.method} ${req.originalUrl} n'existe pas`,
  });
};

const errorHandler = (err, req, res, next) => {
  console.error("❌ Erreur :", err.message);

  let statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  let message = "Une erreur est survenue";
  let errors = null;

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Données invalides";
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Identifiant invalide";
    return res.status(statusCode).json({
      success: false,
      message,
      error: `L'identifiant '${err.value}' n'est pas un ObjectId MongoDB valide`,
    });
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = "Doublon détecté";
    const field = Object.keys(err.keyValue || {}).join(", ");
    return res.status(statusCode).json({
      success: false,
      message,
      error: `Une ressource avec ce(s) champ(s) existe déjà : ${field}`,
    });
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Token JWT invalide";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token JWT expiré";
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || message,
    error: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

export { notFound, errorHandler };
