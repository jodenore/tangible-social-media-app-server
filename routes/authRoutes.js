const authRouter = require("express").Router();

const { registerUser, loginUser } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");

authRouter.post("/register", registerUser);
authRouter.post("/login", loginUser);

authRouter.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-passwordHash")
      .populate(
        "favouritePlayers",
        "fullName slug sport position currentTeam image potentialRating",
      )
      .populate("groups", "name slug description");

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
});

module.exports = authRouter;
