//importing models
const User = require("../models/user");
//TODO: ORDER MODEL

//import helpers
const { errorHandler } = require("../helpers/dbErrorHandler");

//get the user info
exports.read = (req, res) => {
  //send the info without the sensitive info
  req.profile.hashed_password = undefined;
  req.profile.salt = undefined;
  return res.json(req.profile);
};

//update the user info
exports.update = (req, res) => {
  //
};
