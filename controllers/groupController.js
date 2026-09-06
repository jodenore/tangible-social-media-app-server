const Group = require("../models/Group");
const Player = require("../models/Player");
const User = require("../models/User");

async function getAllGroups(req, res) {
  try {
    const groups = await Group.find()
      .populate("owner", "username displayName avatar")
      .populate("members", "username displayName avatar")
      .populate("pendingMembers", "username displayName avatar")
      .populate(
        "favouritePlayers",
        "fullNanme slug sport position currentTeam image",
      );

    return res.json({
      status: "SUCCESS",
      data: groups,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function getGroupById(req, res) {
  try {
    const requestedGroup = await Group.findById(req.params.id)
      .populate("owner", "username displayName avatar")
      .populate("members", "username displayName avatar")
      .populate("pendingMembers", "username displayName avatar")
      .populate(
        "favouritePlayers",
        "fullName slug sport position currentTeam image",
      );

    if (!requestedGroup) {
      return res.status(404).json({
        status: "FAILED",
        message: "Group not found",
      });
    }

    return res.json({
      status: "SUCCESS",
      data: requestedGroup,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function createGroup(req, res) {
  try {
    const group = await Group.create({
      ...req.body,
      owner: req.user._id,
      members: [req.user._id],
    });

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: {
        group: group._id,
      },
    });

    const populatedGroup = await group.populate([
      {
        path: "owner",
        select: "username displayName avatar",
      },
      {
        path: "members",
        select: "username displayName avatar",
      },
      {
        path: "pendingMembers",
        select: "username displayName avatar",
      },
      {
        path: "favouritePlayers",
        select: "fullName slug sport position currentTeam image",
      },
    ]);

    return res.status(201).json({
      status: "SUCCESS",
      data: populatedGroup,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function updateGroup(req, res) {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        status: "FAILED",
        message: "Group not found",
      });
    }

    if (!group.owner.equals(req.user._id)) {
      return res.status(403).json({
        status: "FAILED",
        message: "Only the group owner can update this group",
      });
    }
    group.name = req.body.name ?? group.name;
    group.slug = req.body.slug ?? group.slug;
    group.description = req.body.description ?? group.description;
    group.visibility = req.body.visibility ?? group.visibility;

    await group.save();

    const updatedGroup = await group.populate([
      {
        path: "owner",
        select: "username displayName avatar",
      },
      {
        path: "members",
        select: "username displayName avatar",
      },
      {
        path: "pendingMembers",
        select: "username displayName avatar",
      },
      {
        path: "favouritePlayers",
        select: "fullName slug sport position currentTeam image",
      },
    ]);

    return res.json({
      status: "SUCCESS",
      data: updatedGroup,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function deleteGroup(req, res) {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({
        status: "FAILED",
        message: "Group not found",
      });
    }
    if (!group.owner.equals(req.user._id)) {
      return res.status(403).json({
        status: "FAILED",
        message: "Only the group owner can delete this group",
      });
    }
    // removes id from every user profile
    await User.updateMany(
      {
        groups: group._id,
      },
      {
        $pull: {
          groups: group._id,
        },
      },
    );

    await Group.findByIdAndDelete(req.params.id);

    return res.json({
      status: "SUCCESS",
      message: "Group deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function requestJoinGroup(req, res) {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(400).json({
        status: "FAILED",
        message: "Group not found",
      });
    }

    const isMember = group.members.some((memberId) =>
      memberId.equals(req.user._id),
    );

    if (isMember) {
      return res.status(400).json({
        status: "FAILED",
        message: "You are already a member of this group",
      });
    }

    const alreadyRequested = group.pendingMembers.some((memberId) =>
      memberId.equals(req.user._id),
    );

    if (alreadyRequested) {
      return res.status(400).json({
        status: "FAILED",
        message: "You have already requested to join this group",
      });
    }
    group.pendingMembers.push(req.user._id);
    await group.save();

    const updatedGroup = await group.populate([
      {
        path: "owner",
        select: "username displayName avatar",
      },
      {
        path: "members",
        select: "username displayName avatar",
      },
      {
        path: "pendingMembers",
        select: "username displayName avatar",
      },
      {
        path: "favouritePlayers",
        select: "fullName slug sport position currentTeam image",
      },
    ]);

    return res.json({
      status: "SUCCESS",
      message: "Join request sent",
      data: updatedGroup,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}
async function approveJoinRequest(req, res) {
  try {
    // group id // user being approved
    const { id, userId } = req.params;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        status: "FAILED",
        message: "Group not found",
      });
    }

    const isOwner = group.owner.equals(req.user._id);

    if (!isOwner) {
      return res.status(403).json({
        status: "FAILED",
        message: "Only the group owner can approve join requests",
      });
    }

    const isPending = group.pendingMembers.some((pendingMemberId) =>
      pendingMemberId.equals(userId),
    );

    if (!isPending) {
      return res.status(400).json({
        status: "FAILED",
        message: "User is not in pending members list",
      });
    }

    // removes member from the waiting list
    group.pendingMembers = group.pendingMembers.filter(
      (pendingMemberId) => !pendingMemberId.equals(userId),
    );

    group.members.push(userId);
    await group.save();

    await User.findByIdAndUpdate(userId, {
      $addToSet: {
        groups: group._id,
      },
    });

    const updatedGroup = await group.populate([
      {
        path: "owner",
        select: "username displayName avatar",
      },
      {
        path: "members",
        select: "username displayName avatar",
      },
      {
        path: "pendingMembers",
        select: "username displayName avatar",
      },
      {
        path: "favouritePlayers",
        select: "fullName slug sport position currentTeam image",
      },
    ]);

    return res.json({
      status: "SUCCESS",
      message: "Join request approved",
      data: updatedGroup,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function leaveGroup(req, res) {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        status: "FAILED",
        message: "Group not found",
      });
    }

    const isMember = group.members.some((memberId) =>
      memberId.equals(req.user._id),
    );

    if (!isMember) {
      return res.status(403).json({
        status: "FAILED",
        message: "You are not a member of this group",
      });
    }

    if (group.owner.equals(req.user._id)) {
      return res.status(400).json({
        status: "FAILED",
        message: "You cannot leave a group you own",
      });
    }

    group.members = group.members.filter(
      (memberId) => !memberId.equals(req.user._id),
    );

    await User.findByIdAndUpdate(req.user._id, {
      $pull: {
        groups: group._id,
      },
    });

    const updatedGroup = await group.populate([
      {
        path: "owner",
        select: "username displayName avatar",
      },
      {
        path: "members",
        select: "username displayName avatar",
      },
      {
        path: "pendingMembers",
        select: "username displayName avatar",
      },
      {
        path: "favouritePlayers",
        select: "fullName slug sport position currentTeam image",
      },
    ]);

    return res.json({
      status: "SUCCESS",
      message: "You left the group",
      data: updatedGroup,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function addGroupFavouritePlayer(req, res) {
  try {
    const { id, playerId } = req.params;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        status: "FAILED",
        message: "Group not found",
      });
    }

    if (!group.owner.equals(req.user._id)) {
      return res.status(403).json({
        status: "FAILED",
        message: "Only the group owner can update group favourite players",
      });
    }

    const player = await Player.findById(playerId);

    if (!player) {
      return res.status(404).json({
        status: "FAILED",
        message: "Player not found",
      });
    }

    const alreadyFavourited = group.favouritePlayers.some((favouritePlayerId) =>
      favouritePlayerId.equals(playerId),
    );

    if (alreadyFavourited) {
      return res.status(400).json({
        status: "FAILED",
        message: "Player already added to group favourites",
      });
    }

    group.favouritePlayers.push(playerId);
    await group.save();

    const updatedGroup = await group.populate([
      {
        path: "owner",
        select: "username displayName avatar",
      },
      {
        path: "members",
        select: "username displayName avatar",
      },
      {
        path: "pendingMembers",
        select: "username displayName avatar",
      },
      {
        path: "favouritePlayers",
        select: "fullName slug sport position currentTeam image",
      },
    ]);

    return res.json({
      status: "SUCCESS",
      message: "Player added to group favourites",
      data: updatedGroup,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function removeGroupFavouritePlayer(req, res) {
  try {
    const { id, playerId } = req.params;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        status: "FAILED",
        message: "Group not found",
      });
    }

    if (!group.owner.equals(req.user._id)) {
      return res.status(403).json({
        status: "FAILED",
        message: "You are not the owner of this group",
      });
    }

    const player = await Player.findById(playerId);

    if (!player) {
      return res.status(404).json({
        status: "FAILED",
        message: "Player not found",
      });
    }

    const isFavourited = group.favouritePlayers.some((favouritePlayerId) =>
      favouritePlayerId.equals(playerId),
    );

    if (!isFavourited) {
      return res.status(400).json({
        status: "FAILED",
        message: "Player not favourited",
      });
    }

    group.favouritePlayers = group.favouritePlayers.filter(
      (favouritePlayerId) => !favouritePlayerId.equals(playerId),
    );

    await group.save();

    const updatedGroup = await group.populate([
      {
        path: "owner",
        select: "username displayName avatar",
      },
      {
        path: "members",
        select: "username displayName avatar",
      },
      {
        path: "pendingMembers",
        select: "username displayName avatar",
      },
      {
        path: "favouritePlayers",
        select: "fullName slug sport position currentTeam image",
      },
    ]);

    return res.json({
      status: "SUCCESS",
      message: "Player removed from group favourites.",
      data: updatedGroup,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

module.exports = {
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  requestJoinGroup,
  approveJoinRequest,
  leaveGroup,
  addGroupFavouritePlayer,
  removeGroupFavouritePlayer,
};
