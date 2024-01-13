const express = require("express");
const User = require("../models/user");

const router = express.Router();

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

//Allow new user to register
router.post("/signup", (req, res, next) => {
  //check if username already exist
  User.findOne({ username: req.body.username })
    .then((user) => {
      if (user) {
        //setup error object
        const err = new Error(`User ${req.body.username} already exists!`);
        err.status = 403;
        //pass express the err to handle with next() function
        return next(err);
      } else {
        //user name doesn't exist
        User.create({
          username: req.body.username,
          password: req.body.password,
        })
          .then((user) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json({ status: "Registration Successful!", user: user });
          })
          .catch((err) => next(err));
      }
    })
    .catch((err) => next(err));
});

router.post("/login", (req, res, next) => {
  //Check if user is already logged-in/already tracking authenticated session
  if (!req.session.user) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      const err = new Error("You are not authenticated!");
      res.setHeader("WWW-Authenticate", "Basic");
      err.status = 401;
      return next(err);
    }

    const auth = Buffer.from(authHeader.split(" ")[1], "base64")
      .toString()
      .split(":");
    const username = auth[0];
    const password = auth[1];

    //Check if username is exist, username is unique,
    User.findOne({ username: username })
      .then((user) => {
        if (!user) {
          const err = new Error(`User ${username} does not exist!`);
          err.status = 401;
          return next(err);
        } else if (user.password !== password) {
          const err = new Error("Your password is incorrect!");
          err.status = 401;
          return next(err);
        } else if (user.username === username && user.password === password) {
          req.session.user = "authenticated";
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/plain");
          res.end("You are authenticated!");
        }
      })
      .catch((err) => next(err));
  } else {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end("You are already authenticated!");
  }
});

router.get("/logout", (req, res, next) => {
  //Check if session exist
  if (req.session) {
    req.session.destroy(); //Delete session file from server
    res.clearCookie("session-id"); //clear the cookie on client side
    res.redirect("/"); //redirect user
  } else {
    const err = new Error("You are not logged in!");
    err.status = 401;
    return next(err);
  }
});

module.exports = router;
