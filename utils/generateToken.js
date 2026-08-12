import jwt from "jsonwebtoken";

const generateToken = (userId, role) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || "24h";

  if (!secret) {
    throw new Error("JWT_SECRET n'est pas défini dans les variables d'environnement");
  }

  return jwt.sign({ userId, role }, secret, { expiresIn });
};

export default generateToken;
