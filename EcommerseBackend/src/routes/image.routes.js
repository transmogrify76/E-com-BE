import { Router } from "express";
import { Image } from "../models/e-commerce/image.model";

const router = Router()

router.route("/image").post(Image)

export default router


//http://localhost:3000/images/uploads