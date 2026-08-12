import crypto from "crypto";

const generateParentToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export default generateParentToken;
