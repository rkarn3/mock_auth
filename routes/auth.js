const express = require('express');
const router = express.Router();
const {
  signin,
  signup,
  requireSignIn,
  applyPatch,
  thumbnail,
} = require('../controllers/auth');

router.post('/signup', signup);
router.post('/signin', signin);

router.post('/jpatch', requireSignIn, applyPatch);
router.get('/thumbnail', requireSignIn, thumbnail);

module.exports = router;
