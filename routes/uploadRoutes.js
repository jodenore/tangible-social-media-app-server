const uploadRouter = require("express").Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  uploadImage,
  uploadUserAvatar,
  uploadGroupAvatar,
  uploadPlayerImage,
  uploadPlayerIcon,
  uploadPlayerImages,
} = require("../controllers/uploadController");

uploadRouter.post(
  "/image",
  authMiddleware,
  upload.single("image"),
  uploadImage,
);

uploadRouter.post(
  "/users/avatar",
  authMiddleware,
  upload.single("image"),
  uploadUserAvatar,
);

uploadRouter.post(
  "/groups/:id/avatar",
  authMiddleware,
  upload.single("image"),
  uploadGroupAvatar,
);

uploadRouter.post(
  "/players/:slug/images",
  authMiddleware,
  adminMiddleware,
  upload.array("images", 4),
  uploadPlayerImages,
);

uploadRouter.post(
  "/players/:slug/image",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  uploadPlayerImage,
);

uploadRouter.post(
  "/players/:slug/icon",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  uploadPlayerIcon,
);

module.exports = uploadRouter;
