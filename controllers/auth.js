const Users = require("../models/User");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");

exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const admin = req.body.admin;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (errors.array().length > 1) {
      return res.status(422).json({ message: errors.array() });
    } else {
      return res.status(422).json({ message: errors.array() });
    }
  }

  Users.findOne({ email: email }).then((user) => {
    if (admin) {
      if (user.role !== "admin" && user.role !== "consultant") {
        return res.status(422).json({
          message: [
            { path: "email", msg: "User is not an Admin or consultant" },
          ],
        });
      }
    }
    bcrypt.compare(password, user.password).then((doMatch) => {
      if (doMatch) {
        req.session.regenerate(() => {
          req.session.isLoggedIn = true;
          req.session.user = user;
          return req.session.save(() => {
            res.json({ message: "Đăng nhập thành công!" });
          });
        });
      }
    });
  });
};

exports.signup = (req, res, next) => {
  const name = req.body.fullname;
  const email = req.body.email;
  const password = req.body.password;
  const phone = req.body.phone;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (errors.array().length > 1) {
      return res.status(422).json({ message: errors.array() });
    } else {
      return res.status(422).json({ message: errors.array() });
    }
  }

  bcrypt.hash(password, 12).then((hashedPassword) => {
    const user = new Users({
      fullname: name,
      email: email,
      password: hashedPassword,
      phone: phone,
    });
    user.save();
    res.status(200).json({ message: "Signup succesfull!" });
  });
};

exports.getLogout = (req, res, next) => {
  req.session.destroy();
  res.json({ message: "Logout Successfull!" });
};
