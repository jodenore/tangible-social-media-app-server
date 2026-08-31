const {
  createComment,
  getCommentById,
  fetchCommentsByPostId,
  getCommentsByAuthor,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment,
} = require("../controllers/commentController");
const commentRouter = require("express").Router();

const authMiddleware = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

commentRouter.get(
  "/post/:postId",
  validateObjectId("postId"),
  fetchCommentsByPostId,
);
commentRouter.get(
  "/author/:authorId",
  validateObjectId("authorId"),
  getCommentsByAuthor,
);
commentRouter.get("/:id", validateObjectId("id"), getCommentById);

// routes below this require a token

commentRouter.use(authMiddleware);

commentRouter.post("/create", createComment);
commentRouter.patch("/:id/like", validateObjectId("id"), likeComment);
commentRouter.patch("/:id/unlike", validateObjectId("id"), unlikeComment);
commentRouter.patch("/:id", validateObjectId("id"), updateComment);
commentRouter.delete("/:id", validateObjectId("id"), deleteComment);

module.exports = commentRouter;
