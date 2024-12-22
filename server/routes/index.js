import express from 'express';

import apiRouter from './api/index.js';
import clientRouter from './client/index.js';
// import viewerRouter from './viewer/index.js';

const router = express.Router();

// serve some paths from other nested routers
router.use('/api', apiRouter);

router.use((req, res, next) => {
  if (req.subdomains.length) {
    // viewerRouter(req, res, next);
  } else {
    clientRouter(req, res, next);
  }
});

export default router;
