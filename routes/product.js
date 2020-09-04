//category routes
const express = require("express");
const router = express.Router();

//import product controllers
const { create, read, list } = require("../controllers/product");
const { productById } = require("../middlewares/product");
//import auth controllers
const { requireSignin, isAuth, isAdmin } = require("../middlewares/auth");
//import user controllers
const { userById } = require("../middlewares/user");

//api endpoints
router.post("/product/create/:userId", requireSignin, isAdmin, create);
router.get("/product/:productId", read);
router.get("/products", list);

//make user and product available in req when logged in
router.param("userId", userById);
router.param("productId", productById);

//exports
module.exports = router;
