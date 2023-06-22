const express = require('express');

const publishedRouter = require('./published');
const reactRouter = require('./react');

const router = express.Router();

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
