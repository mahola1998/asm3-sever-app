const express = require("express");
require("dotenv").config();
const fs = require("fs");
const https = require("https");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const mongodbStore = require("connect-mongodb-session")(session);
const http = require("http");
const socketIo = require("socket.io");
const LiveChat = require("./models/LiveChat");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const authRoute = require("./routes/auth");
const shopRoute = require("./routes/shop");
const adminRoute = require("./routes/admin");

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.j08nn.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;
// const privateKey = fs.readFileSync("server.key");
// const certificate = fs.readFileSync("server.cert");

const app = express();
// const server = https.createServer({ key: privateKey, cert: certificate }, app);
const server = http.createServer(app);

const store = new mongodbStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(express.urlencoded({ extended: false }));

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);

app.use(helmet());
app.use(compression());
app.use(morgan("combined", { stream: accessLogStream }));

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);

const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
      maxAge: 180 * 60 * 1000,
      httpOnly: true,
      secure: false,
    },
  })
);

//
app.use((req, res, next) => {
  if (req.session.user) {
    req.user = req.session.user;
  }
  next();
});

app.use("/auth", authRoute);
app.use("/shop", shopRoute);
app.use("/admin", adminRoute);

//live chat
io.on("connection", (socket) => {
  socket.on("start", async ({ userId }) => {
    if (!userId) {
      console.error("User ID is undefined.");
      socket.emit("error", "User ID is required to start a chat.");
      return;
    }

    let livechat = await LiveChat.findOne({ userId });
    if (!livechat) {
      livechat = new LiveChat({ userId });
      await livechat.save();
      console.log("New livechat created with ID:", livechat._id);
    }

    socket.join(livechat._id.toString());
    socket.emit("livechat-id", livechat._id.toString());
  });
  socket.on("join_chat", ({ livechatId }) => {
    socket.join(livechatId);
  });

  socket.on("send_message", async (data) => {
    const { livechatId, message, sender } = data;
    const liveChat = await LiveChat.findById(livechatId);

    if (liveChat) {
      liveChat.messages.push({ sender, message, timestamp: Date.now() });
      await liveChat.save();

      io.to(livechatId).emit("receive_message", { message, sender });
    } else {
      socket.emit("error", "Chat not found");
    }
  });

  socket.on("end", ({ livechatId }) => {
    if (!livechatId) {
      console.error("Livechat ID is required to end a chat.");
      socket.emit("error", "Livechat ID is required to end a chat.");
      return;
    }
    socket.leave(livechatId);
    socket.emit("chat_ended");
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    ssl: true,
  })
  .then(() => server.listen(process.env.PORT || 5000))
  .catch((err) => {
    console.error("Database connection error:", err);
  });
