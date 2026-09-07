const {
  getAllPosts,
  getPostById,
  fetchPostsByPlayerId,
  createPost,
  updatePost,
  deletePost,
  fetchPostsByAuthorId,
  fetchPostsByGroupId,
  likePost,
  unlikePost,
} = require("../controllers/postController");
const postRouter = require("express").Router();
// validate param middleware
const validateObjectId = require("../middleware/validateObjectId");

// protect post routes
const authMiddleware = require("../middleware/authMiddleware");

postRouter.get("/", getAllPosts);
postRouter.get(
  "/player/:playerId",
  validateObjectId("playerId"),
  fetchPostsByPlayerId,
);
postRouter.get(
  "/author/:authorId",
  validateObjectId("authorId"),
  fetchPostsByAuthorId,
);
postRouter.get(
  "/group/:groupId",
  validateObjectId("groupId"),
  fetchPostsByGroupId,
);
postRouter.get("/:id", validateObjectId("id"), getPostById);

// every route below this line is protected
postRouter.use(authMiddleware);

// add CRUD post routes

postRouter.post("/", createPost);
postRouter.patch("/:id/like", validateObjectId("id"), likePost);
postRouter.patch("/:id/unlike", validateObjectId("id"), unlikePost);
postRouter.patch("/:id", validateObjectId("id"), updatePost);

postRouter.delete("/:id", validateObjectId("id"), deletePost);

module.exports = postRouter;
