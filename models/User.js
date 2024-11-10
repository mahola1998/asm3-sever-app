const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, require: true, unique: true },
  fullname: { type: String, requuire: true },
  password: { type: String, require: true },
  phone: { type: Number, require: true },
  role: {
    type: String,
    enum: ["user", "admin", "consultant"],
    default: "user",
  },
});

module.exports = mongoose.model("Users", userSchema);
