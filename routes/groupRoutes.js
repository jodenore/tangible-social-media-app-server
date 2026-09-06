const groupRouter = require("express").Router();

const {
  getAllGroups,
  getGroupById,
  createGroup,
  deleteGroup,
  requestJoinGroup,
  approveJoinRequest,
  leaveGroup,
  removeGroupFavouritePlayer,
  updateGroup,
  addGroupFavouritePlayer,
} = require("../controllers/groupController");

const authMiddleware = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

// public read routes

groupRouter.get("/", getAllGroups);
groupRouter.get("/:id", validateObjectId("id"), getGroupById);

// auth gate

groupRouter.use(authMiddleware);

// protected routes
groupRouter.post("/", createGroup);
groupRouter.patch("/:id", validateObjectId("id"), updateGroup);
groupRouter.delete("/:id", validateObjectId("id"), deleteGroup);

// members route

groupRouter.patch("/:id/join", validateObjectId("id"), requestJoinGroup);
groupRouter.patch(
  "/:id/approve/:userId",
  validateObjectId("id"),
  validateObjectId("userId"),
  approveJoinRequest,
);

groupRouter.patch("/:id/leave", validateObjectId("id"), leaveGroup);

// Group favourite player routes
groupRouter.patch(
  "/:id/favourite-players/:playerId",
  validateObjectId("id"),
  validateObjectId("playerId"),
  addGroupFavouritePlayer,
);

groupRouter.delete(
  "/:id/favourite-players/:playerId",
  validateObjectId("id"),
  validateObjectId("playerId"),
  removeGroupFavouritePlayer,
);

module.exports = groupRouter;
