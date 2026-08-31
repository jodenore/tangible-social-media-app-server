const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    // Points to the User Model for population
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Points to the Player Model for population
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      default: null,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    image: {
      type: String,
      default: "",
    },
    // Points to the User Model for population
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
