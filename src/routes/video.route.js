import { Router } from "express";
import { addVideo, getAllVideos } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()

router.route("/").get(verifyJWT, getAllVideos)
router.route("upload-video").post(
    verifyJWT,
    upload.fields([
        {
            name: "videoFile",
            maxcount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    addVideo
)



export default router

