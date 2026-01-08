import { Router } from "express";
import { addVideo, deleteVideo, getAllVideos, getVideoById, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()

router.route("/").get(verifyJWT, getAllVideos)
router.route("/upload-video").post(
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
router.route("/:videoId").get(verifyJWT, getVideoById)
router.route("/update-video/:videoId").patch(verifyJWT, upload.single("thumbnail"), updateVideo)
router.route("/delete-video/:videoId").delete(verifyJWT, deleteVideo)
router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus );



export default router

