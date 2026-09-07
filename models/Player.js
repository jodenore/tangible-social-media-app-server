const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    sport: {
      type: String,
      required: true,
      trim: true,
    },

    position: {
      type: String,
      trim: true,
    },

    currentTeam: {
      type: String,
      trim: true,
    },

    age: {
      type: Number,
      min: 10,
      max: 25,
    },

    image: {
      type: String,
      default: "",
    },
    iconImage: {
      type: String,
      default: "",
    },
    gallery: [
      {
        url: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ["action", "training", "game", "portrait"],
          default: "action",
        },
        caption: {
          type: String,
          default: "",
        },
      },
    ],

    bio: {
      type: String,
      maxlength: 600,
      default: "",
    },

    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    favouritesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    potentialRating: {
      type: Number,
      min: 1,
      max: 100,
      default: 75,
    },
  },
  {
    timestamps: true,
  },
);

const Player = mongoose.model("Player", playerSchema);

module.exports = Player;
