const Player = require("../models/Player");
const User = require("../models/User");

async function getAllPlayers(req, res) {
  try {
    const { search, sport, position, sortBy } = req.query;

    let players = await Player.find();

    if (search) {
      players = players.filter((player) => {
        return (
          player.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          player.currentTeam?.toLowerCase().includes(search.toLowerCase()) ||
          player.position?.toLowerCase().includes(search.toLowerCase())
        );
      });
    }

    if (sport) {
      players = players.filter(
        (player) => player.sport.toLowerCase() === sport.toLowerCase(),
      );
    }

    if (position) {
      players = players.filter(
        (player) => player.position.toLowerCase() === position.toLowerCase(),
      );
    }

    if (sortBy) {
      if (sortBy.toLowerCase() === "potential") {
        players.sort((a, b) => b.potentialRating - a.potentialRating);
      } else if (sortBy.toLowerCase() === "views") {
        players.sort((a, b) => b.views - a.views);
      } else if (sortBy.toLowerCase() === "age") {
        players.sort((a, b) => a.age - b.age);
      }
    }

    return res.json({
      status: "SUCCESS",
      data: players,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function getPlayerById(req, res) {
  try {
    const player = await Player.findByIdAndUpdate(
      req.params.id,
      {
        $inc: { views: 1 },
      },
      {
        new: true,
      },
    );

    if (!player) {
      return res.status(404).json({
        status: "FAILED",
        message: "Player not found",
      });
    }

    return res.json({
      status: "SUCCESS",
      data: player,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function getRandomPlayer(req, res) {
  try {
    const player = await Player.aggregate([{ $sample: { size: 1 } }]);

    if (!player) {
      return res.status(404).json({
        status: "FAILED",
        message: "Player not found",
      });
    }
    return res.json({
      status: "SUCCESS",
      data: player,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function getMostViewedPlayer(req, res) {
  try {
    const player = await Player.findOne({}, null, { sort: { views: -1 } });
    if (!player) {
      return res.status(404).json({
        status: "FAILED",
        message: "Player not found",
      });
    }

    return res.json({
      status: "SUCCESS",
      data: player,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function createPlayer(req, res) {
  try {
    const player = await Player.create(req.body);
    return res.status(201).json({
      status: "SUCCESS",
      data: player,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function updatePlayer(req, res) {
  try {
    const player = await Player.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!player) {
      return res.status(404).json({
        status: "FAILED",
        message: "Player not found",
      });
    }
    res.json({
      status: "SUCCESS",
      data: player,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function addFavouritePlayer(req, res) {
  try {
    const { id, playerId } = req.params;

    // Make sure users can only edit their own favourite players list
    if (!req.user._id.equals(id)) {
      return res.status(403).json({
        status: "FAILED",
        message: "You can only update your own favourite players",
      });
    }

    const player = await Player.findById(playerId);

    if (!player) {
      return res.status(404).json({
        status: "FAILED",
        message: "Player not found",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: "FAILED",
        message: "User not found",
      });
    }
    // prevent duplicate favourites before increasing faouriteCount
    const alreadyFavourited = user.favouritePlayers.some((favouritePlayerId) =>
      favouritePlayerId.equals(playerId),
    );

    if (alreadyFavourited) {
      return res.json({
        status: "SUCCESS",
        message: "Player already in favourites",
        data: user,
      });
    }

    user.favouritePlayers.push(playerId);
    await user.save();

    player.favouritesCount += 1;
    await player.save();

    res.json({
      status: "SUCCESS",
      message: "Player added to favourites",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function removeFavouritePlayer(req, res) {
  try {
    const { id, playerId } = req.params;

    if (!req.user._id.equals(id)) {
      return res.status(403).json({
        status: "FAILED",
        message: "You can only update your own favourite players",
      });
    }

    const player = await Player.findById(playerId);

    if (!player) {
      return res.status(404).json({
        status: "FAILED",
        message: "Player not found",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: "FAILED",
        message: "User not found",
      });
    }

    const isFavourited = user.favouritePlayers.some((favouritePlayerId) =>
      favouritePlayerId.equals(playerId),
    );

    if (!isFavourited) {
      return res.status(400).json({
        status: "FAILED",
        message: "Player is not in favourites",
      });
    }

    user.favouritePlayers = user.favouritePlayers.filter(
      (favouritePlayerId) => !favouritePlayerId.equals(playerId),
    );
    await user.save();

    // prevents the favouritesCount from dropping to lower than 0
    player.favouritesCount = Math.max(0, player.favouritesCount - 1);
    await player.save();

    res.json({
      status: "SUCCESS",
      message: "Player removed from favourites",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

async function deletePlayer(req, res) {
  try {
    const player = await Player.findByIdAndDelete(req.params.id);

    if (!player) {
      return res.status(404).json({
        status: "FAILED",
        message: "Player not found",
      });
    }
    res.json({
      status: "SUCCESS",
      message: "Player deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
}

module.exports = {
  getAllPlayers,
  getPlayerById,
  getRandomPlayer,
  getMostViewedPlayer,
  createPlayer,
  updatePlayer,
  addFavouritePlayer,
  removeFavouritePlayer,
  deletePlayer,
};
