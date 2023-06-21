const express = require('express');
const path = require('path');

const publishedRouter = require('./published');
const reactRouter = require('./react');

const router = express.Router();

// configure serving up a built client app assets
router.use(express.static(path.join(__dirname, '../../client/build'), { index: false }));

// configure serving any static file in public folder
router.use(express.static(path.join(__dirname, '../public')));

// serve some paths from other nested routers
router.use('/api', require('./api'));

router.use((req, res, next) => {
  if (req.subdomains.length) {
    publishedRouter(req, res, next);
  } else {
    reactRouter(req, res, next);
  }
});

module.exports = router;
