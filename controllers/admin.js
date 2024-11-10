const LiveChat = require("../models/LiveChat");
const Orders = require("../models/Order");
const Users = require("../models/User");
const Products = require("../models/Product");

exports.getLiveChat = async (req, res, next) => {
  const liveChat = await LiveChat.find().lean();
  res.status(200).json(liveChat);
};

exports.getOrders = async (req, res, next) => {
  const data = [];
  try {
    const users = await Users.find().lean();
    const orders = await Orders.find().lean();
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    const endOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0
    );
    const ordersThisMonth = await Orders.find({
      createdAt: { $gte: startOfMonth, $lt: endOfMonth },
    }).lean();
    const totalThisMonth = ordersThisMonth.reduce(
      (sum, order) => sum + order.total,
      0
    );
    const averageRevenue = ordersThisMonth.length
      ? totalThisMonth / ordersThisMonth.length
      : 0;

    for (const order of orders) {
      const user = await Users.findById(order.user.user);
      data.push({ order, user });
    }
    const resData = {
      orders: data,
      totalRevenue,
      averageRevenue,
      users: users.length,
    };

    res.status(200).json(resData);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Error fetching orders" });
  }
};

exports.postAddProduct = (req, res, next) => {
  const { name, category, shortDescription, longDescription, price, count } =
    req.body;
  const image = req.files;

  let img1, img2, img3, img4;
  if (image && image[0]) img1 = "http://localhost:5000/" + image[0].path;
  if (image && image[1]) img2 = "http://localhost:5000/" + image[1].path;
  if (image && image[2]) img3 = "http://localhost:5000/" + image[2].path;
  if (image && image[3]) img4 = "http://localhost:5000/" + image[3].path;

  const product = new Products({
    category: category,
    img1: img1,
    img2: img2,
    img3: img3,
    img4: img4,
    long_desc: longDescription,
    name: name,
    price: price,
    short_desc: shortDescription,
    count: count,
  });

  product
    .save()
    .then((result) => {
      res.status(200).json({ message: "Created Product" });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Create product failed.",
        error: err.message,
      });
    });
};

exports.putEditProduct = async (req, res, next) => {
  const productId = req.params.productId;
  const { name, category, shortDescription, longDescription, price, count } =
    req.body;
  const images = req.files;
  let img1, img2, img3, img4;
  if (images && images[0]) img1 = "http://localhost:5000/" + images[0].path;
  if (images && images[1]) img2 = "http://localhost:5000/" + images[1].path;
  if (images && images[2]) img3 = "http://localhost:5000/" + images[2].path;
  if (images && images[3]) img4 = "http://localhost:5000/" + images[3].path;

  try {
    const product = await Products.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.category = category;
    product.name = name;
    product.price = price;
    product.short_desc = shortDescription;
    product.long_desc = longDescription;
    product.count = count;

    if (img1) product.img1 = img1;
    if (img2) product.img2 = img2;
    if (img3) product.img3 = img3;
    if (img4) product.img4 = img4;

    await product.save();
    res.status(200).json({ message: "Product updated successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Failed to update product",
      error: err.message,
    });
  }
};

exports.deleteProduct = async (req, res, next) => {
  const productId = req.params.productId;
  try {
    await Products.deleteOne({ _id: productId });
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product" });
    console.log(error);
  }
};
