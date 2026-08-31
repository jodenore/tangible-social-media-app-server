const User = require("../models/User");
const bcrypt = require("bcrypt");

async function getAllUsers(req, res) {
  try {
    const users = await User.find().populate("favouritePlayers");
    if (!users) {
      return res.status(404).json({
        status: "FAILED",
        message: "No users found",
      });
    }
    return res.json({
      status: "SUCCESS",
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.id).populate(
      "favouritePlayers",
    );
    if (!user) {
      return res.status(404).json({
        status: "FAILED",
        message: "User not found",
      });
    }
    return res.json({
      status: "SUCCESS",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function createUser(req, res) {
  try {
    const {
      username,
      displayName,
      favouritePlayers,
      email,
      password,
      avatar,
      bio,
    } = req.body;

    if (!password) {
      return res.status(400).json({
        status: "FAILED",
        message: "Password is required",
      });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      displayName,
      email,
      passwordHash,
      avatar,
      favouritePlayers,
      bio,
    });

    const userResponse = user.toObject();
    delete userResponse.passwordHash;

    return res.status(201).json({
      status: "SUCCESS",
      data: userResponse,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function updateUser(req, res) {
  try {
    if (!req.user._id.equals(req.params.id)) {
      return res.status(403).json({
        status: "FAILED",
        message: "You can only update your own profile",
      });
    }
    // allowed fields for updating // user cannot update protected fields
    const allowedUpdates = {
      username: req.body.username,
      displayName: req.body.displayName,
      email: req.body.email,
      avatar: req.body.avatar,
      bio: req.body.bio,
    };

    // remove fields that were not sent so old values stay unchanged

    Object.keys(allowedUpdates).forEach((key) => {
      if (allowedUpdates[key] === undefined) {
        delete allowedUpdates[key];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, allowedUpdates, {
      new: true,
      runValidators: true,
    }).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        status: "FAILED",
        message: "User not found",
      });
    }
    res.json({
      status: "SUCCESS",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function deleteUser(req, res) {
  try {
    if (!req.user._id.equals(req.params.id)) {
      return res.status(403).json({
        status: "FAILED",
        message: "You can only delete your own profile",
      });
    }

    const user = await User.findByIdAndDelete(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: "FAILED",
        message: "User not found",
      });
    }
    res.json({
      status: "SUCCESS",
      message: "User deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
