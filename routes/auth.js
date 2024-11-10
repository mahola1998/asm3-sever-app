const express = require("express");
const { body } = require("express-validator");

const authController = require("../controllers/auth");
const Users = require("../models/User");
const isAuth = require("../middlewares/is-auth");

const router = express.Router();

router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .notEmpty()
      .withMessage("Please enter email.")
      .custom((value, { req }) => {
        return Users.findOne({ email: value }).then((userDoc) => {
          console.log(userDoc);
          if (!userDoc) {
            return Promise.reject("E-Mail is not exists already!");
          }
        });
      }),

    body("password").notEmpty().withMessage("Please enter a password!"),
  ],
  authController.login
);

router.post(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .notEmpty()
      .withMessage("Please enter email.")
      .custom((value, { req }) => {
        return Users.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject(
              "E-Mail exists already, please pick a different one."
            );
          }
        });
      }),

    body("fullname").notEmpty().withMessage("Please enter a name!"),
    body("phone")
      .notEmpty()
      .withMessage("PLease enter a phone")
      .isNumeric()
      .withMessage("Phone number must be a number"),
    body("password")
      .isLength({ min: 9 })
      .withMessage("Please enter a password at lest 9 characters!")
      .notEmpty()
      .withMessage("Please enter a password!"),
  ],
  authController.signup
);

router.get("/check-login", (req, res) => {
  if (req.session.isLoggedIn) {
    res.status(200).json({ loggedIn: true, user: req.session.user });
  } else {
    res.status(200).json({ loggedIn: false });
  }
});

router.get("/logout", authController.getLogout);

module.exports = router;
