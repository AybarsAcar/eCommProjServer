//category routes
const express = require("express");
const router = express.Router();

//import category controllers
const {
  create,
  read,
  list,
  update,
  remove,
} = require("../controllers/category");
// improt category middlewares
const { categoryById } = require("../middlewares/category");
//import auth controllers
const { requireSignin, isAuth, isAdmin } = require("../middlewares/auth");
//import user controllers
const { userById } = require("../middlewares/user");

//api endpoints
router.post("/category/create/:userId", requireSignin, isAdmin, create);
router.get("/categories", list);
router.get("/category/:categoryId", read);
router.put("/category/:categoryId/:userId", requireSignin, isAdmin, update);
router.delete("/category/:categoryId/:userId", requireSignin, isAdmin, remove);

//make user and category available in req when logged in
router.param("userId", userById);
router.param("categoryId", categoryById);

//exports
module.exports = router;
