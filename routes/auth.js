//auth routes
const express = require("express");
const router = express.Router();

//import controllers
const {
  preSignup,
  signup,
  signin,
  signout,
  forgotPassword,
  resetPassword,
  googleLogin,
  facebookLogin,
} = require("../controllers/auth");

//import validators
const {
  userSigninValidator,
  userSignupValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require("../validators/auth");
const { runValidation } = require("../validators");

//api end points for authentication
router.post("/pre-signup", userSignupValidator, runValidation, preSignup);
router.post("/signup", signup);
router.post("/signin", userSigninValidator, runValidation, signin);
router.get("/signout", signout);

//forgot password
router.put(
  "/forgot-password",
  forgotPasswordValidator,
  runValidation,
  forgotPassword
);

//reset password
router.put(
  "/reset-password",
  resetPasswordValidator,
  runValidation,
  resetPassword
);

//social logins
router.post("/google-login", googleLogin);
router.post("/facebook-login", facebookLogin);

//exports
module.exports = router;
