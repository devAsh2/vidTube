import {Router} from "express";
import {healthCheck} from "../controllers/healthCheck.controller.js"; // Ensure this matches the correct casing

const router = Router();

router.route("/").get(healthCheck);

export default router;
