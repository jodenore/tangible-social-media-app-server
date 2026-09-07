const { default: mongoose } = require("mongoose");
const Comment = require("../models/Comment");
const Post = require("../models/Post");

async function populateComment(comment) {
  return comment.populate([
    {
      path: "author",
      select: "username displayName avatar",
    },
    {
      path: "post",
      select: "content player",
    },
  ]);
}

async function getAllComments(req, res) {
  try {
    const comments = await Comment.find()
      .populate("author", "username displayName avatar")
      .populate("post", "content player");

    return res.json({
      status: "SUCCESS",
      data: comments,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function getCommentById(req, res) {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate("author", "username displayName avatar")
      .populate("post", "content player");

    if (!comment) {
      return res.status(404).json({
        status: "FAILED",
        message: "Comment not found",
      });
    }

    return res.json({
      status: "SUCCESS",
      data: comment,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function fetchCommentsByPostId(req, res) {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate("author", "username displayName avatar")
      .populate("post", "player")
      .sort({ createdAt: 1 });

    return res.json({
      status: "SUCCESS",
      data: comments,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function getCommentsByAuthor(req, res) {
  try {
    const comments = await Comment.find({ author: req.params.authorId })
      .populate("author", "username displayName avatar")
      .populate("post", "content player");

    return res.json({
      status: "SUCCESS",
      data: comments,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function createComment(req, res) {
  try {
    const comment = await Comment.create({
      ...req.body,
      author: req.user._id, // uses the logged-in users token id as the comment author
    });

    await Post.findByIdAndUpdate(comment.post, {
      $inc: {
        commentsCount: 1,
      },
    });

    const populatedComment = await comment.populate([
      {
        path: "author",
        select: "username displayName avatar",
      },
      {
        path: "post",
        select: "content player",
      },
    ]);

    return res.status(201).json({
      status: "SUCCESS",
      data: populatedComment,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function updateComment(req, res) {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        status: "FAILED",
        message: "Comment not found",
      });
    }
    //  only the original author can update this comment
    if (!comment.author.equals(req.user._id)) {
      return res.status(403).json({
        status: "FAILED",
        message: "You can only update your own comments",
      });
    }

    comment.content = req.body.content ?? comment.content;
    await comment.save();

    const updatedComment = await comment.populate([
      {
        path: "author",
        select: "username displayName avatar",
      },
      {
        path: "post",
        select: "content player",
      },
    ]);

    return res.json({
      status: "SUCCESS",
      data: updatedComment,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function likeComment(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: "FAILED",
        message: "Invalid comment ID",
      });
    }

    const comment = await Comment.findByIdAndUpdate(
      id,
      {
        $addToSet: {
          likes: userId, // prevent the same user from liking the comment twice
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!comment) {
      return res.status(404).json({
        status: "FAILED",
        message: "Comment not found",
      });
    }

    const populatedComment = await populateComment(comment);

    return res.json({
      status: "SUCCESS",
      data: populatedComment,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function unlikeComment(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: "FAILED",
        message: "Invalid comment ID",
      });
    }

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        status: "FAILED",
        message: "Comment not found",
      });
    }

    const isLiked = comment.likes.some((likeId) => likeId.equals(userId));

    if (!isLiked) {
      return res.status(400).json({
        status: "FAILED",
        message: "Comment is not liked by this user",
      });
    }

    //  Keep every like except the logged-in user's id
    comment.likes = comment.likes.filter((likeId) => !likeId.equals(userId));
    await comment.save();

    const populatedComment = await populateComment(comment);

    return res.json({
      status: "SUCCESS",
      data: populatedComment,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function deleteComment(req, res) {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        status: "FAILED",
        message: "Comment not found",
      });
    }

    if (!comment.author.equals(req.user._id)) {
      return res.status(403).json({
        status: "FAILED",
        message: "You can only delete your own comments",
      });
    }

    await Comment.findByIdAndDelete(req.params.id);

    return res.json({
      status: "SUCCESS",
      message: "Comment deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

module.exports = {
  getAllComments,
  getCommentById,
  fetchCommentsByPostId,
  getCommentsByAuthor,
  createComment,
  updateComment,
  unlikeComment,
  likeComment,
  deleteComment,
};
