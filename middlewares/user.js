//import models
const User = require("../models/user");

//imports
const jwt = require("jsonwebtoken");
const expressJwt = require("express-jwt");
const _ = require("lodash");

//check if the user logged in ingo
exports.userById = (req, res, next, id) => {
  //find the user by id
  User.findById(id).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found",
      });
    }

    //if the user is found add that to the req object with the name of profile
    req.profile = user;
    next();
  });
};
