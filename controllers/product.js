//imports
const formidable = require("formidable");
const _ = require("lodash");
const fs = require("fs");

//import models
const Product = require("../models/product");

//import helpers
const { errorHandler } = require("../helpers/dbErrorHandler");

//create a product
exports.create = (req, res) => {
  //initiate a new form data
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;

  form.parse(req, (err, fields, files) => {
    //handle error
    if (err) {
      return res.status(400).json({
        error: "Image could not be uploaded",
      });
    }

    //valudation of the fields
    const { name, description, price, category, quantity, shipping } = fields;

    if (
      !name ||
      !description ||
      !price ||
      !category ||
      !quantity ||
      !shipping
    ) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    //if no error uploading create a new product
    let product = new Product(fields);

    //handle the files -- add the photo
    if (files.photo) {
      console.log(files.photo);

      //file size validation
      if (files.photo.size > 10000000) {
        return res.status(400).json({
          error: "Image should be less than 10mb in size",
        });
      }

      //add the photo
      product.photo.data = fs.readFileSync(files.photo.path);
      product.photo.contentType = files.photo.type;
    }

    //now save
    product.save((err, result) => {
      if (err) {
        console.log("PRODUCT CREATE ERROR", err);
        return res.status(400).json({
          error: errorHandler(err),
        });
      }

      res.json(result);
    });
  });
};

//read a single product
exports.read = (req, res) => {
  //dont send the photo
  req.product.photo = undefined;

  //get the product id from the request param object
  return res.json(req.product);
};

//SELL AND ARRIVAL ------------------------------------------------------------
//if no params are sent return all the products

exports.list = (req, res) => {
  //grab the route queries or assign the defualt values
  let order = req.query.order ? req.query.order : "asc";
  let sortBy = req.query.sortBy ? req.query.sortBy : "_id";
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;

  //get the products
  Product.find()
    .select("-photo")
    .populate("category")
    .sort([sortBy, order])
    .limit(limit)
    .exec((err, products) => {
      if (err) {
        return res.status(400).json({
          error: "Products not found",
        });
      }

      //if found send the products as a json object
      res.json(products);
    });
};

//list categories based on the category of the product
exports.listRelated = (req, res) => {
  //set a default limit
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;

  //all the products except the one we are browsing
  Product.find({ _id: { $ne: req.product }, category: req.product.category })
    .limit(limit)
    .populate("category", "_id name")
    .exec((err, products) => {
      if (err) {
        return res.status(400).json({
          error: "Products not found",
        });
      }

      //if found send the products as a json object
      res.json(products);
    });
};

//list categories used in products
exports.listCategories = (req, res) => {
  //find the categories used in products
  Product.distinct("category", {}, (err, categories) => {
    if (err) {
      return res.status(400).json({
        error: "Products not found",
      });
    }
    //if found send the categories as a json object
    res.json(categories);
  });
};
