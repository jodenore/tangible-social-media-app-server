const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { randomUUID } = require("crypto");

const supabaseS3Client = require("../utils/supabaseS3Client");
const Player = require("../models/Player");
const User = require("../models/User");
const Group = require("../models/Group");

const imageExtensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const uploadFolders = ["avatars", "posts", "players"];

function getPublicImageUrl(key) {
  const storageUrl = process.env.SUPABASE_S3_ENDPOINT.replace(
    /\/storage\/v1\/s3\/?$/,
    "",
  );
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET;

  return `${storageUrl}/storage/v1/object/public/${bucketName}/${key}`;
}

async function uploadFileToStorage(file, key) {
  await supabaseS3Client.send(
    new PutObjectCommand({
      Bucket: process.env.SUPABASE_STORAGE_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  return {
    key,
    url: getPublicImageUrl(key),
  };
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
    const uploadedImage = await uploadFileToStorage(req.file, key);

    return res.status(201).json({
      status: "SUCCESS",
      data: uploadedImage,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function uploadUserAvatar(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "FAILED",
        message: "An avatar image is required",
      });
    }

    const extension = imageExtensions[req.file.mimetype];
    const key = `avatars/users/${req.user._id}/${randomUUID()}.${extension}`;
    const uploadedImage = await uploadFileToStorage(req.file, key);
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: uploadedImage.url },
      { new: true, runValidators: true },
    ).select("-passwordHash");

    return res.status(201).json({
      status: "SUCCESS",
      data: { user, image: uploadedImage },
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function uploadGroupAvatar(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "FAILED",
        message: "A group image is required",
      });
    }

    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        status: "FAILED",
        message: "Group not found",
      });
    }

    if (!group.owner.equals(req.user._id)) {
      return res.status(403).json({
        status: "FAILED",
        message: "Only the group owner can update its image",
      });
    }

    const extension = imageExtensions[req.file.mimetype];
    const key = `avatars/groups/${group._id}/${randomUUID()}.${extension}`;
    const uploadedImage = await uploadFileToStorage(req.file, key);

    group.image = uploadedImage.url;
    await group.save();

    return res.status(201).json({
      status: "SUCCESS",
      data: { group, image: uploadedImage },
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function uploadPlayerImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "FAILED",
        message: "A player image is required",
      });
    }

    const playerSlug = req.params.slug.trim().toLowerCase();
    const player = await Player.findOne({ slug: playerSlug });

    if (!player) {
      return res.status(404).json({
        status: "FAILED",
        message: "Player not found",
      });
    }

    const extension = imageExtensions[req.file.mimetype];
    const key = `players/${player.slug}/${player.slug}-profile-${randomUUID()}.${extension}`;
    const uploadedImage = await uploadFileToStorage(req.file, key);

    player.image = uploadedImage.url;
    await player.save();

    return res.status(201).json({
      status: "SUCCESS",
      data: {
        player,
        image: uploadedImage,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function uploadPlayerIcon(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "FAILED",
        message: "A 250 x 250 player icon is required",
      });
    }

    const playerSlug = req.params.slug.trim().toLowerCase();
    const player = await Player.findOne({ slug: playerSlug });

    if (!player) {
      return res.status(404).json({
        status: "FAILED",
        message: "Player not found",
      });
    }

    const extension = imageExtensions[req.file.mimetype];
    const key = `players/${player.slug}/${player.slug}-icon-${randomUUID()}.${extension}`;
    const uploadedImage = await uploadFileToStorage(req.file, key);

    player.iconImage = uploadedImage.url;
    await player.save();

    return res.status(201).json({
      status: "SUCCESS",
      data: {
        player,
        image: uploadedImage,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function uploadPlayerImages(req, res) {
  try {
    if (!req.files?.length) {
      return res.status(400).json({
        status: "FAILED",
        message: "At least one player image is required",
      });
    }

    const playerSlug = req.params.slug.trim().toLowerCase();
    const player = await Player.findOne({ slug: playerSlug });

    if (!player) {
      return res.status(404).json({
        status: "FAILED",
        message: "Player not found",
      });
    }

    const uploadedImages = await Promise.all(
      req.files.map((file, index) => {
        const extension = imageExtensions[file.mimetype];
        const key = `players/${player.slug}/${player.slug}-${index + 1}-${randomUUID()}.${extension}`;

        return uploadFileToStorage(file, key);
      }),
    );

    const galleryImages = uploadedImages.map((image) => ({
      url: image.url,
      type: req.body.type || "action",
      caption: req.body.caption || "",
    }));

    player.gallery.push(...galleryImages);
    await player.save();

    return res.status(201).json({
      status: "SUCCESS",
      data: {
        player,
        images: uploadedImages,
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
  uploadUserAvatar,
  uploadGroupAvatar,
  uploadPlayerImage,
  uploadPlayerIcon,
  uploadPlayerImages,
};
