const Products = require("../models/Product");
const Orders = require("../models/Order");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "mahola1998@gmail.com",
    pass: "vqod udhf jtkj jabf",
  },
});

const HTML_TEMPLATE = (user, phone, adress, price, cart) => {
  html = `
  <div style="font-family: Arial, sans-serif; color: black;">
  <h1>Xin Chào ${user}</h1>
  <p>Phone: ${phone}</p>
  <p>address: ${adress}</p>

  <!-- Bảng dữ liệu -->
  <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr style="background-color: #f2f2f2;">
        <th style="padding: 8px;">Tên Sản Phẩm</th>
        <th style="padding: 8px;">Hình Ảnh</th>
        <th style="padding: 8px;">Giá</th>
        <th style="padding: 8px;">Số lượng</th>
        <th style="padding: 8px;">Thành tiền</th>
      </tr>
    </thead>
    <tbody>`;
  cart.map((item) => {
    const price = (item.product.price * item.quantity).toLocaleString("de-DE");
    html += `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 12px; text-align: left; font-weight: 500; color: #333;">
            ${item.product.name}
          </td>
          <td style="padding: 12px; width: 150px; text-align: center;">
            <img style="width: 100%; border-radius: 8px; object-fit: cover;" src="${
              item.product.img1
            }" alt="${item.product.name}" />
          </td>
          <td style="padding: 12px; text-align: center; font-weight: bold;">
            ${item.product.price.toLocaleString("de-DE")} VND
          </td>
          <td style="padding: 12px; text-align: center; color: #333;">
            ${item.quantity}
          </td>
          <td style="padding: 12px; text-align: center; font-weight: bold;">
            ${price} VND
          </td>
        </tr>
      `;
  });

  html += `
    </tbody>
    </table>
    <h1>Tổng Thanh Toán:</h1>
    <h1>${price} VND</h1>
    <div style="margin-top: 20px;">
    <h2 style="font-size: 1.2em; color: #333;">Cảm ơn bạn!</h2>
  </div>
</div>
  `;
  return html;
};

exports.getProducts = async (req, res, next) => {
  const products = await Products.find().lean();
  res.status(200).json(products);
};

exports.getProduct = async (req, res, next) => {
  const prodId = req.params.productId;
  const product = await Products.findById(prodId);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  const productList = await Products.find({
    category: product.category,
    _id: { $ne: prodId },
  });
  res.status(200).json({ product, productList });
};

exports.postOrder = async (req, res, next) => {
  try {
    const user = req.user;
    const { cartItems, total, data } = req.body;
    const formattedNumber = total.toLocaleString("de-DE");
    const products = await Promise.all(
      cartItems.map(async (item) => {
        const product = await Products.findById(item.product);
        if (!product) {
          throw new Error(`Product with ID ${item.product} not found`);
        }
        product.count -= item.quantity;
        await product.save();

        return {
          product: product._id,
          quantity: item.quantity,
        };
      })
    );

    const newOrder = new Orders({
      products: products,
      total: total,
      user: { user: user, address: data.address },
      status: "processing",
    });

    const savedOrder = await newOrder.save().then(() => {
      const options = {
        from: "<mahola1998@gmail.com",
        to: "maholaz1998@gmail.com",
        subject: "order confirmation",
        html: HTML_TEMPLATE(
          user.fullname,
          user.phone,
          data.address,
          formattedNumber,
          cartItems
        ),
      };
      transporter.sendMail(options, (err, info) => {
        if (err) {
          console.log("Error occurred:", err);
        } else {
          console.log("Email sent:", info.response);
        }
      });
    });
    res.status(201).json({
      message: "Order placed successfully",
      order: savedOrder,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.getOrder = async (req, res, next) => {
  const orderArr = [];
  const orders = await Orders.find().lean();

  orders.forEach((el) => {
    if (el.user.user.toString() === req.user._id.toString()) {
      orderArr.push(el);
    }
  });

  if (orderArr.length === 0) {
    return res.status(404).json({ message: "No orders found for this user." });
  }
  res.status(200).json({
    order: orderArr,
    user: { name: req.user.fullname, phone: req.user.phone },
  });
};

exports.getOrderDetail = async (req, res, next) => {
  try {
    const products = [];
    const prodId = req.params.orderId;
    const order = await Orders.findById(prodId).lean();
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
    const productDetails = await Promise.all(
      order.products.map(async (el) => {
        const product = await Products.findById(el.product).lean();
        return { product, quantity: el.quantity };
      })
    );
    res.status(200).json({
      products: productDetails,
      user: { user: req.user, address: order.user.address },
      total: order.total,
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ message: "Failed to fetch order details." });
  }
};

exports.getCount = async (req, res, next) => {
  const items = [];
  for (let i = 0; i < req.body.items.length; i++) {
    const item = await Products.findById(req.body.items[i].id);
    items.push({ item: req.body.items[i].id, count: item.count });
  }
  res.status(200).json(items);
};
