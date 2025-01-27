import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { refreshAccesToken } from "../controllers/user.controller.js";
import { forgotPassword } from "../controllers/user.controller.js";
import { verifyOTPAndResetPassword } from "../controllers/user.controller.js";
import { getUserById } from "../controllers/user.controller.js";

const router = Router()

router.route("/register").post(registerUser),

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT , logoutUser)

router.route("/refresh-token").post(refreshAccesToken)

router.route("/forgot-password").post(forgotPassword)

router.route("/varifyOTP").post(verifyOTPAndResetPassword)

router.route("/:userId").get(getUserById)


export default router