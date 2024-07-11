import { Router } from "express";
import { loginSeller, registerSeller } from "../controllers/seller.controller.js";
;

const router = Router()

router.route("/registerSeller").post(registerSeller)
router.route("/login").post(loginSeller)


export default router