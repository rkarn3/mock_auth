const User = require('../models/user');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const jsonpatch = require('jsonpatch');
const fs = require('fs');
const path = require('path');
const got = require('got');
const sharp = require('sharp');

exports.signup = (req, res) => {
  User.findOne({ username: req.body.username }).exec((err, user) => {
    if (user) {
      return res.status(400).json({
        error: 'Username Taken',
      });
    }
    const { username, password } = req.body;

    let newUser = new User({ username, password });
    newUser.save((err, success) => {
      if (err) {
        return res.status(400).json({
          error: err,
        });
      }
      res.json({
        message: 'signup success!! Please Signin....',
      });
    });
  });
};

exports.signin = (req, res) => {
  const { username, password } = req.body;
  //check if user exists

  User.findOne({ username }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User doesn't exist. Please Signup",
      });
    }

    //authenticate user
    if (!user.authenticate(password)) {
      return res.status(400).json({
        error: "username and password don't match",
      });
    }

    //generate a jwt and send to client
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
    res.cookie('token', token, { expiresIn: '1d' });
    return res.json({
      token,
      //   user: { _id, username },
    });
  });
};

exports.requireSignIn = expressJwt({
  secret: process.env.JWT_SECRET,
  algorithms: ['HS256'],
});

exports.applyPatch = (req, res) => {
  const { original, patch } = req.body;
  const token = req.cookies['token'];
  User.findOne({ token }).exec((err, user) => {
    if (err) {
      return res.status(400).json({
        error: err,
      });
    }
    const modified = jsonpatch.apply_patch(original, patch);
    return res.json({ modified });
  });
};

exports.thumbnail = (req, res) => {
  const url = req.body;
  const dest = path.resolve(__dirname, 'images', 'code.jpeg');
  const sharpStream = sharp({
    failOnError: false,
  });

  const promises = [];

  promises.push(
    sharpStream
      .clone()
      .resize({ width: 50, height: 50 })
      .jpeg({ quality: 100 })
      .toFile(dest)
  );
  got.stream(url).pipe(sharpStream);

  Promise.all(promises)
    .then((val) => {
      console.log('Done!', val);
      res.json(val);
    })
    .catch((err) => {
      console.error("Error processing files, let's clean it up", err);
      try {
        fs.unlinkSync(dest);
      } catch (e) {}
    });
};
