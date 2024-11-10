const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  category: { type: String, require: true },
  img1: { type: String },
  img2: { type: String },
  img3: { type: String },
  img4: { type: String },
  long_desc: { type: String },
  name: { type: String },
  price: { type: Number },
  short_desc: { type: String },
  count: { type: Number },
});

module.exports = mongoose.model("Product", productSchema);
