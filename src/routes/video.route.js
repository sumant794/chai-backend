import { Router } from "express";
import { getAllVideos } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/").get(verifyJWT, getAllVideos)



export default router

