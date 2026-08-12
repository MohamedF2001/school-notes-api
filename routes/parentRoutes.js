import express from "express";
import {
  createParent,
  getParents,
  getParentById,
  updateParent,
  deleteParent,
  generateAccessLink,
  getAccessLinks,
  revokeAccessLink,
} from "../controllers/parentController.js";
import { verifyToken, verifyDirector } from "../middlewares/auth.js";
import { validateObjectIdParam } from "../middlewares/validate.js";

const router = express.Router();

router.use(verifyToken, verifyDirector);

router.get("/", getParents);
router.get("/:id", validateObjectIdParam("id"), getParentById);
router.post("/", createParent);
router.put("/:id", validateObjectIdParam("id"), updateParent);
router.delete("/:id", validateObjectIdParam("id"), deleteParent);
router.post("/:id/access-link", validateObjectIdParam("id"), generateAccessLink);
router.get("/:id/access-links", validateObjectIdParam("id"), getAccessLinks);
router.delete(
  "/:id/access-link/:tokenId",
  validateObjectIdParam("id"),
  validateObjectIdParam("tokenId"),
  revokeAccessLink
);

export default router;
