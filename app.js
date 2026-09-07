const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const playerRouter = require("./routes/playerRoutes");
const userRouter = require("./routes/userRoutes");
const postRouter = require("./routes/postRoutes");
const commentRouter = require("./routes/commentRoutes");
const authRouter = require("./routes/authRoutes");
const notFoundMiddleware = require("./middleware/notFoundMiddleware");
const groupRouter = require("./routes/groupRoutes");
const uploadRouter = require("./routes/uploadRoutes");
const app = express();

// Body parser

app.use(express.json());

// CORS
app.use(cors());

// Morgan

app.use(morgan("dev"));

// Health Check route.

app.get("/", (req, res) => {
  res.json({
    status: "SUCCESS",
    app: "Tangible",
    message: "API is currently up and running.",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/players", playerRouter);
app.use("/api/users", userRouter);
app.use("/api/posts", postRouter);
app.use("/api/comments", commentRouter);
app.use("/api/groups", groupRouter);
app.use("/api/uploads", uploadRouter);
app.use(notFoundMiddleware);

module.exports = app;
