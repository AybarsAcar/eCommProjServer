//import models
const User = require("../models/user");

//imports
const jwt = require("jsonwebtoken");
const expressJwt = require("express-jwt");
const _ = require("lodash");

//import helpers
const { errorHandler } = require("../helpers/dbErrorHandler");

//to protect a route
exports.requireSignin = expressJwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
});

//Auth Middleware
exports.isAuth = (req, res, next) => {
  const user = req.profile._id == req.user._id;

  if (!user) {
    return res.status(403).json({
      error: "Access denied",
    });
  }
  console.log("ACCESS GRANTED");
  next();
};

//Admin Middleware
exports.isAdmin = (req, res, next) => {
  if (req.profile.role === 0) {
    return res.status(403).json({
      error: "Admin resource only",
    });
  }
  console.log("ADMIN ACCESSED");
  next();
};
