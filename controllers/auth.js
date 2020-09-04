//import models
const User = require("../models/user");

//imports
const jwt = require("jsonwebtoken");
const expressJwt = require("express-jwt");
const _ = require("lodash");

//google
const { OAuth2Client } = require("google-auth-library");
//facebook -- manually fetch
const fetch = require("node-fetch");

//sendgril Mail system
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

//import helpers
const { errorHandler } = require("../helpers/dbErrorHandler");

//pre signup for email authentication
exports.preSignup = (req, res) => {
  //user info from the request body
  const { email, name, password } = req.body;

  //check if the email already exists
  User.findOne({ email: email.toLowerCase() }, (err, user) => {
    if (user) {
      return res.status(400).json({
        error: "Email is already taken",
      });
    }

    //otherwise create a token with the user info
    const token = jwt.sign(
      { email, name, password },
      process.env.JWT_ACCOUNT_ACTIVATION,
      {
        expiresIn: "10m",
      }
    );

    //create the email data with the token
    const emailData = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `The Merch Perch Account Activation Link`,
      html: `
        <h1>Just one more step...</h1>
        <h2>Please use the following link to activate your account:</h2>
        <h4>${process.env.CLIENT_URL}/auth/account/activate/${token}</h4>
        <hr />
        <p>This email map contain sensitive information</p>
        <p>https://themerchperch.com</p>
     `,
    };

    sgMail
      .send(emailData)
      .then((sent) => {
        return res.json({
          message: `Email has successfully been sent to ${email}!`,
        });
      })
      .catch((err) => {
        return res.json({
          message: err.message,
        });
      });
  });
};

//Signup method
exports.signup = (req, res) => {
  //get the token from the body
  const token = req.body.token;

  if (token) {
    //verify the token
    jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, function (
      err,
      decoded
    ) {
      if (err) {
        return res.status(401).json({
          error: "Link has been expired. Please sign up again",
        });
      }

      //get the user info from the token
      const { name, email, password } = jwt.decode(token);

      //create a new user
      const user = new User({ name, email, password });
      user.save((err, user) => {
        if (err) {
          return res.status(401).json({
            error: errorHandler(err),
          });
        }

        return res.json({
          message: "You have successfully signed up. Please sign in",
        });
      });
    });
  } else {
    //handle if theres no token
    return res.status(401).json({
      error: "Oops.. Something went wrong. Please try again",
    });
  }
};

//Signin Method
exports.signin = (req, res) => {
  //get the email and password from the body
  const { email, password } = req.body;

  //check if the user exists
  User.findOne({ email }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User does not exist. Please sign up",
      });
    }

    //authenticate -- check if the password and email match
    if (!user.authenticate(password)) {
      return res.status(400).json({
        error: "Email and password do not match",
      });
    }

    //otherwise generate a token and send to the client
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const { _id, name, email, role } = user;

    //return the user and the token
    return res.json({
      token: token,
      user: {
        _id,
        name,
        email,
        role,
      },
    });
  });
};

//signout
exports.signout = (req, res) => {
  res.clearCookie("token");
  res.json({
    message: "Signed out successfully",
  });
};

//forgot password controller
exports.forgotPassword = (req, res) => {
  //grab the email from the body
  const { email } = req.body;

  //find the user based on the email
  User.findOne({ email }, (err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User with that email does not exist",
      });
    }

    //otherwise generate a token
    const token = jwt.sign(
      { _id: user._id, name: user.name },
      process.env.JWT_RESET_PASSWORD,
      {
        expiresIn: "10m",
      }
    );

    //create and email data with the token
    const emailData = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `The Perch Merch Password Reset Link`,
      html: `
        <h2>Please use the following link to reset your password:</h2>
        <h4>${process.env.CLIENT_URL}/auth/password/reset/${token}</h4>
        <hr />
        <p>This email may contain sensitive information</p>
        <p>https://themerchperch.com</p>
      `,
    };

    //populate the db with user resetPasswordLink
    return user.updateOne({ resetPasswordLink: token }, (err, success) => {
      if (err) {
        return res.json({ error: errorHandler(err) });
      } else {
        sgMail.send(emailData).then((sent) => {
          return res.json({
            message: `The Password Reset Link has successfully been sent to ${email}`,
          });
        });
      }
    });
  });
};

//forgot password controller
exports.resetPassword = (req, res) => {
  //get the resetPasswordLink and the newPassword
  const { resetPasswordLink, newPassword } = req.body;

  //find the user based on the resetPasswordLink
  if (resetPasswordLink) {
    //verify if the token has expired
    jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD, function (
      err,
      decoded
    ) {
      if (err) {
        return res.status(401).json({
          error: "The Link has been expired. Please try again",
        });
      }

      //otherwise find the user now
      User.findOne({ resetPasswordLink }, (err, user) => {
        if (err || !user) {
          return res.status(401).json({
            error: "Oops.. Something went wrong. Please try agan",
          });
        }

        //update the user
        const updatedFields = {
          password: newPassword,
          resetPasswordLink: "",
        };

        user = _.extend(user, updatedFields);
        //save the updated user
        user.save((err, result) => {
          if (err || !user) {
            return res.status(400).json({
              error: errorHandler(err),
            });
          }

          //success
          res.json({
            message: `Great! Now you can login with your new password`,
          });
        });
      });
    });
  }
};

//initialise the client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
//GOOGLE login
exports.googleLogin = (req, res) => {
  //send the id token from the client side
  const idToken = req.body.tokenId;

  //verify the token
  client
    .verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID })
    .then((response) => {
      //response has the user info
      const { email_verified, name, email, jti } = response.payload;

      if (email_verified) {
        //check if the user already exists in our db
        User.findOne({ email }).exec((err, user) => {
          if (user) {
            //create token
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
              expiresIn: "7d",
            });
            res.cookie("token", token, { expiresIn: "7d" });

            const { _id, email, name, role } = user;
            return res.json({
              token,
              user: { _id, email, name, role },
            });
          } else {
            //if the user with the google email doesnt exist
            let password = jti + process.env.JWT_SECRET;

            user = new User({ name, email, password });
            user.save((err, data) => {
              if (err) {
                return res.status(400).json({
                  error: errorHandler(err),
                });
              }

              //generate a token and set in the cookie
              const token = jwt.sign(
                { _id: data._id },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
              );
              res.cookie("token", token, { expiresIn: "7d" });

              const { _id, email, name, role } = data;
              return res.json({
                token,
                user: { _id, email, name, role },
              });
            });
          }
        });
      } else {
        return res.status(400).json({
          error: "Google login failed. Please try again",
        });
      }
    });
};

exports.facebookLogin = (req, res) => {
  //get the userId and accessToken from the body
  const { userID, accessToken } = req.body;

  console.log(req.body);

  //facebooks url
  const url = `https://graph.facebook.com/v2.11/${userID}/?fields=id,name,email&access_token=${accessToken}`;

  //make request to facebooks url
  return fetch(url, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((response) => {
      const { email, name } = response;

      //query the db to check if the user already exists in our db
      User.findOne({ email }).exec((err, user) => {
        if (user) {
          //create token
          const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
          });
          res.cookie("token", token, { expiresIn: "7d" });

          const { _id, email, name, role } = user;
          return res.json({
            token,
            user: { _id, email, name, role },
          });
        } else {
          //if the user does not exist in our db
          let password = email + process.env.JWT_SECRET;

          user = new User({ name, email, password });
          user.save((err, data) => {
            if (err) {
              return res.status(400).json({
                error: errorHandler(err),
              });
            }

            //otherwise generate a token and set in the cookie
            const token = jwt.sign({ _id: data._id }, process.env.JWT_SECRET, {
              expiresIn: "7d",
            });
            res.cookie("token", token, { expiresIn: "7d" });

            const { _id, email, name, role } = data;
            return res.json({
              token,
              user: { _id, email, name, role },
            });
          });
        }
      });
    })
    .catch((err) => {
      res.json({
        error: "Facebook Login failed. Please try again",
      });
    });
};
