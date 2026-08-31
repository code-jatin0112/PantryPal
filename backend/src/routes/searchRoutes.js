import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { handleSearch } from "../controllers/searchController.js";

const router = express.Router();

router.use(authenticate);
router.get("/", handleSearch);

export default router;
