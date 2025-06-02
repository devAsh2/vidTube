import {Router} from "express";
import {getAllVideos,
    publishAtVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus} from "../controllers/video.controller.js";
import {upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

//routes
router.route("/getAllVideos").post(getAllVideos);
router.route("/getVideoById/:id").get(getVideoById);

// secured routes
router.route("/publishAtVideo").post(verifyJWT, upload.single("video") , publishAtVideo);
router.route("/updateVideo/:id").patch(verifyJWT, updateVideo);
router.route("/deleteVideo/:id").delete(verifyJWT, deleteVideo);
router.route("/togglePublishStatus/:videoId").get(verifyJWT, togglePublishStatus);

