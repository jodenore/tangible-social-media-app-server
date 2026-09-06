const { default: mongoose } = require("mongoose");
const Post = require("../models/Post");
const Group = require("../models/Group");

async function getAllPosts(req, res) {
  try {
    const { search, sport, sortBy } = req.query; // read optional filters from the URL
    let posts = await Post.find()
      .populate("author", "username displayName avatar")
      .populate("player", "fullName slug sport position currentTeam image")
      .populate("group", "name slug");
    // Populate replaces author/player/grpip ObjectIds with readable objects.
    if (sport) {
      // prevents errors if a post has no linked player
      posts = posts.filter((post) => post?.player?.sport === sport);
    }

    if (search) {
      posts = posts.filter((post) =>
        post.content.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (sortBy) {
      if (sortBy.toLowerCase() === "latest") {
        posts.sort((a, b) => b.createdAt - a.createdAt);
      }
      if (sortBy.toLowerCase() === "oldest") {
        posts.sort((a, b) => a.createdAt - b.createdAt);
      }
      if (sortBy.toLowerCase() === "likes") {
        posts.sort((a, b) => b.likes.length - a.likes.length);
      }
    }

    return res.json({
      status: "SUCCESS",
      data: posts,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function getPostById(req, res) {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "username displayName avatar")
      .populate("player", "fullName slug sport position currentTeam image")
      .populate("group", "name slug");

    if (!post) {
      return res.status(404).json({
        status: "FAILED",
        message: "Post not found",
      });
    }

    return res.json({
      status: "SUCCESS",
      data: post,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function fetchPostsByPlayerId(req, res) {
  try {
    const posts = await Post.find({ player: req.params.playerId })
      .populate("author", "username displayName avatar")
      .populate("player", "fullName slug sport position currentTeam image")
      .populate("group", "name slug");

    return res.json({
      status: "SUCCESS",
      data: posts,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function fetchPostsByAuthorId(req, res) {
  try {
    const posts = await Post.find({ author: req.params.authorId })
      .populate("author", "username displayName avatar")
      .populate("player", "fullName slug sport position currentTeam image")
      .populate("group", "name slug");

    return res.json({
      status: "SUCCESS",
      data: posts,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function createPost(req, res) {
  try {
    if (req.body.group) {
      let foundGroup = await Group.findById(req.body.group);
      if (!foundGroup) {
        return res.status(404).json({
          status: "FAILED",
          message: "Group not found",
        });
      }
      let isMember = foundGroup.members.some((member) =>
        member.equals(req.user._id),
      );
      if (!isMember) {
        return res.status(403).json({
          status: "FAILED",
          message: "You are not a member of this group",
        });
      }
    }

    const post = await Post.create({
      ...req.body,
      author: req.user._id, // use the logged-in user's token id as the author
    });

    const populatedPost = await post.populate([
      {
        path: "author",
        select: "username displayName avatar",
      },
      {
        path: "player",
        select: "fullName slug sport position currentTeam image",
      },
      {
        path: "group",
        select: "name slug",
      },
    ]);

    return res.status(201).json({
      status: "SUCCESS",
      data: populatedPost,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function updatePost(req, res) {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        status: "FAILED",
        message: "Post not found",
      });
    }
    if (!post.author.equals(req.user._id)) {
      return res.status(403).json({
        status: "FAILED",
        message: "You can only update your own posts",
      });
    }
    // keep the old value if theres no new value
    post.content = req.body.content ?? post.content;
    post.image = req.body.image ?? post.image;
    post.player = req.body.player ?? post.player;

    await post.save();

    // A post's group is locked after creation, so updatePost does not change post.group.

    const updatedPost = await post.populate([
      {
        path: "author",
        select: "username displayName avatar",
      },
      {
        path: "player",
        select: "fullName slug sport position currentTeam image",
      },
      {
        path: "group",
        select: "name slug",
      },
    ]);

    return res.json({
      status: "SUCCESS",
      data: updatedPost,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}
async function likePost(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: "FAILED",
        message: "Invalid postId",
      });
    }

    const post = await Post.findByIdAndUpdate(
      id,
      {
        $addToSet: {
          // prevents user liking the post twice
          likes: userId,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!post) {
      return res.status(404).json({
        status: "FAILED",
        message: "Post not found",
      });
    }

    return res.json({
      status: "SUCCESS",
      data: post,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function unlikePost(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: "FAILED",
        message: "Invalid postId",
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        status: "FAILED",
        message: "Post not found",
      });
    }
    // check if this logged-in user has liked the post before removing the like
    const isLiked = post.likes.some((likeId) => likeId.equals(userId));

    if (!isLiked) {
      return res.status(400).json({
        status: "FAILED",
        message: "Post is not liked by this user",
      });
    }
    // Keep every like except the logged in user's id
    post.likes = post.likes.filter((likeId) => !likeId.equals(userId));
    await post.save();

    return res.json({
      status: "SUCCESS",
      data: post,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function deletePost(req, res) {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        status: "FAILED",
        message: "Post not found",
      });
    }

    if (!post.author.equals(req.user._id)) {
      return res.status(403).json({
        status: "FAILED",
        message: "You can only delete your own posts",
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    return res.json({
      status: "SUCCESS",
      message: "Post deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

module.exports = {
  getAllPosts,
  getPostById,
  fetchPostsByPlayerId,
  fetchPostsByAuthorId,
  createPost,
  updatePost,
  likePost,
  unlikePost,
  deletePost,
};
