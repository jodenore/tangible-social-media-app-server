const multer = require("multer");
const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1004,
  },
  fileFilter(req, file, callback) {
    if (!allowedImageTypes.includes(file.mimetype)) {
      return callback(
        new Error("Only JPG, PNG, GIF, and WEBP images are allowed"),
      );
    }
    return callback(null, true);
  },
});

module.exports = upload;
