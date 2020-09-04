//imports
const formidable = require("formidable");
const _ = require("lodash");
const fs = require("fs");

//import models
const Product = require("../models/product");

//import helpers
const { errorHandler } = require("../helpers/dbErrorHandler");

//MIDDLEWARE to find the product by id
exports.productById = (req, res, next, id) => {
  //find the product by id
  Product.findById(id)
    .populate("category")
    .exec((err, product) => {
      if (err || !product) {
        return res.status(400).json({
          error: "Product not found",
        });
      }

      //if found populate the request parameter object
      req.product = product;
      next();
    });
};
