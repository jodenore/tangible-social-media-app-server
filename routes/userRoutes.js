const userRouter = require("express").Router();

const {
  addFavouritePlayer,
  removeFavouritePlayer,
} = require("../controllers/playerController");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

userRouter.get("/", getAllUsers);
userRouter.get("/:id", validateObjectId("id"), getUserById);

// routes below this require a token

userRouter.use(authMiddleware);

userRouter.post("/", createUser);
userRouter.patch(
  "/:id/favourite-players/:playerId",
  validateObjectId("id"),
  validateObjectId("playerId"),
  addFavouritePlayer,
);
userRouter.patch("/:id", validateObjectId("id"), updateUser);
userRouter.delete(
  "/:id/favourite-players/:playerId",
  validateObjectId("id"),
  validateObjectId("playerId"),
  removeFavouritePlayer,
);
userRouter.delete("/:id", validateObjectId("id"), deleteUser);

module.exports = userRouter;
