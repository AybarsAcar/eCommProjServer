const express = require("express");
const router = express.Router();

//import user controllers
const { read, update } = require("../controllers/user");
// import user middlewares
const { userById } = require("../middlewares/user");
//import auth controllers
const { requireSignin, isAuth, isAdmin } = require("../middlewares/auth");

//api endpoints
router.get("/user/:userId", requireSignin, isAuth, read);
router.put("/user/:userId", requireSignin, isAuth, update);
//user wishlist
router.get("/wishlist/by/user/:userId");
//user history
router.get("/orders/by/user/:userId");

//make the user available in req when logged in
router.param("userId", userById);

//exports
module.exports = router;
