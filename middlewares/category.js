//import models
const Category = require("../models/category");

//import helpers
const { errorHandler } = require("../helpers/dbErrorHandler");

//MIDDLEWARE to have the category in the req object
exports.categoryById = (req, res, next, id) => {
  Category.findById(id).exec((err, category) => {
    if (err || !category) {
      return res.status(400).json({
        error: "Category does not exist",
      });
    }

    //otherwise add that to the req object
    req.category = category;
    next();
  });
};
