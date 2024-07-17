import { Router } from "express";
import { loginSeller, logoutSeller, registerSeller } from "../controllers/seller.controller.js";
import { verifyJWT } from "../middlewares/sellerAuth.middleware.js";
import { refreshAccesToken } from "../controllers/seller.controller.js";

const router = Router()

router.route("/registerSeller").post(registerSeller)
router.route("/loginSeller").post(loginSeller)
router.route("/logoutSeller").post(verifyJWT , logoutSeller)
router.route("/refresh-token").post(refreshAccesToken)

export default router