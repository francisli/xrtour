const express = require('express');

const clientRouter = require('./client');
const viewerRouter = require('./viewer');

const router = express.Router();

// serve some paths from other nested routers
router.use('/api', require('./api'));

router.use((req, res, next) => {
  if (req.subdomains.length) {
    viewerRouter(req, res, next);
  } else {
    clientRouter(req, res, next);
  }
});

module.exports = router;
