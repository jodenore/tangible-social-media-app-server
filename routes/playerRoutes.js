const {
  getAllPlayers,
  getPlayerById,
  getRandomPlayer,
  createPlayer,
  updatePlayer,
  deletePlayer,
  getMostViewedPlayer,
} = require("../controllers/playerController");
const playerRouter = require("express").Router();

const authMiddleware = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

playerRouter.get("/", getAllPlayers);
playerRouter.get("/random", getRandomPlayer);
playerRouter.get("/mostviewed", getMostViewedPlayer);
playerRouter.get("/:id", validateObjectId("id"), getPlayerById);

// routes below this require a token
playerRouter.use(authMiddleware);

playerRouter.post("/", createPlayer);
playerRouter.patch("/:id", validateObjectId("id"), updatePlayer);
playerRouter.delete("/:id", validateObjectId("id"), deletePlayer);

module.exports = playerRouter;
