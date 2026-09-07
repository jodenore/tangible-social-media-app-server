const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { randomUUID } = require("crypto");

const supabaseS3Client = require("../utils/supabaseS3Client");

const imageExtensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const uploadFolders = ["avatars", "posts"];

function getPublicImageUrl(key) {
  const storageUrl = process.env.SUPABASE_S3_ENDPOINT.replace(
    /\/storage\/v1\/s3\/?$/,
    "",
  );
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET;

  return `${storageUrl}/storage/v1/object/public/${bucketName}/${key}`;
}

async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "FAILED",
        message: "An image file is required",
      });
    }

    const folder = uploadFolders.includes(req.body.folder)
      ? req.body.folder
      : "posts";

    const extension = imageExtensions[req.file.mimetype];

    const key = `${folder}/${req.user._id}/${randomUUID()}.${extension}`;

    await supabaseS3Client.send(
      new PutObjectCommand({
        Bucket: process.env.SUPABASE_STORAGE_BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      }),
    );

    return res.status(201).json({
      status: "SUCCESS",
      data: {
        key,
        url: getPublicImageUrl(key),
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

module.exports = {
  uploadImage,
};
