import {Router} from "express";
import {registerUser, loginUser, refreshAccessToken, logoutUser,
    changeCurrentPassword, getCurrentUser, updateAccountDetails,
    updateUserAvatar, updateCoverImage, getUserChannelProfile, getWatchHistory} from "../controllers/users.controller.js"; // Ensure this matches the correct casing
import {upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {name:"avatar", maxCount:1},
        {name:"coverImage", maxCount:1}
    ])
    ,registerUser
);

//secured routes
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/updateAccountDetails").patch(verifyJWT, updateAccountDetails);
router.route("/updateAvatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);                           
router.route("/updateCoverImage").patch(verifyJWT, upload.single("coverImage"), updateCoverImage);
router.route("/channel/:username").get(verifyJWT, getUserChannelProfile);
router.route("/history").get(verifyJWT, getWatchHistory);

//unsecured routes
//setting up verifyJWT middleware for logout user controller functionality
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/login").post(loginUser);
router.route("refresh-token").post(refreshAccessToken);



export default router;