const uploadRouter = require("express").Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { uploadImage } = require("../controllers/uploadController");

uploadRouter.post(
  "/image",
  upload.single("image"),
  authMiddleware,
  uploadImage,
);

module.exports = uploadRouter;
