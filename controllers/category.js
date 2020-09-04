//import models
const Category = require("../models/category");

//import helpers
const { errorHandler } = require("../helpers/dbErrorHandler");

//Create a Category
exports.create = (req, res) => {
  //create a new category with the info from the request body
  const category = new Category(req.body);
  //then save
  category.save((err, data) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }

    //successfully created
    res.json({ data });
  });
};

//Find category by id
exports.read = (req, res) => {
  return res.json(req.category);
};

//List all the Categories
exports.list = (req, res) => {
  Category.find({}).exec((err, data) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }

    //otherwise send the data
    res.json(data);
  });
};

//Update a Category
exports.update = (req, res) => {
  //
};

//Delete a Category
exports.remove = (req, res) => {
  //
};
