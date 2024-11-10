const express = require("express");
const upload = require("../utils/multer");
const adminController = require("../controllers/admin");
const isAuth = require("../middlewares/is-auth");

const router = express.Router();

router.get("/livechat", isAuth.all, adminController.getLiveChat);

router.get("/orders", isAuth.all, adminController.getOrders);

router.post(
  "/new-product",
  isAuth.all,
  upload.array("image", 4),
  adminController.postAddProduct
);

router.put(
  "/update/:productId",
  isAuth.all,
  upload.array("image", 4),
  adminController.putEditProduct
);

router.delete("/delete/:productId", isAuth.all, adminController.deleteProduct);

module.exports = router;
