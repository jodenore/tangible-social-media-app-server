const jwt = require("jsonwebtoken"); // jwt
const User = require("../models/User"); // Adjust the path as needed

async function authMiddleware(req, res, next) {
  try {
    // stop requests with no token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "FAILED",
        message: "Not authorized, token missing",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // legit unedited token
    const user = await User.findById(decoded.userId).select("-passwordHash");

    if (!user) {
      return res.status(401).json({
        status: "FAILED",
        message: "Not authorized, user not found",
      });
    }
    // Update authMiddleware so that req.user includes role
    req.user = {
      _id: user._id,
      username: user.username,
      role: user.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({
      status: "FAILED",
      message: "Not authorized, token invalid",
    });
  }
}

module.exports = authMiddleware;
