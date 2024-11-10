const express = require("express");

const shopController = require("../controllers/shop");
const isAuth = require("../middlewares/is-auth");

const router = express.Router();

router.get("/products", shopController.getProducts);

router.get("/product/:productId", shopController.getProduct);

router.post("/order", isAuth.all, shopController.postOrder);

router.get("/order", isAuth.all, shopController.getOrder);

router.get("/order/:orderId", isAuth.all, shopController.getOrderDetail);

router.post("/getCount", shopController.getCount);

module.exports = router;
