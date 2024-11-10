const mongoose = require("mongoose");

const liveChatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  consultantId: { type: mongoose.Schema.Types.ObjectId, ref: "Consultant" },
  messages: [
    {
      sender: String,
      message: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

const LiveChat = mongoose.model("LiveChat", liveChatSchema);

module.exports = LiveChat;
