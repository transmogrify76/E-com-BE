import { Router } from "express";
import { loginAdmin, logoutAdmin, registerAdmin } from "../controllers/admin.controller.js";
import { verifyJWT } from "../middlewares/adminAuth.middleware.js";

const router = Router()

router.route("/registerAdmin").post(registerAdmin)
router.route("/loginAdmin").post(loginAdmin)
router.route("/logoutAdmin").post(verifyJWT , logoutAdmin)


export default router