import express from 'express';
import { StatusCodes } from 'http-status-codes';
import _ from 'lodash';

import interceptors from '../interceptors.js';
import models from '../../models/index.js';

const router = express.Router();

router.patch('/:id', interceptors.requireLogin, async (req, res) => {
  const record = await models.File.findByPk(req.params.id, { include: { model: models.Resource, include: 'Team' } });
  if (record) {
    const membership = await record.Resource.Team.getMembership(req.user);
    if (!membership) {
      res.status(StatusCodes.UNAUTHORIZED).end();
    } else {
      try {
        await record.update(_.pick(req.body, ['externalURL', 'key', 'originalName', 'duration', 'width', 'height']));
        res.json(record.toJSON());
      } catch (error) {
        if (error.name === 'SequelizeValidationError') {
          res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
            status: StatusCodes.UNPROCESSABLE_ENTITY,
            errors: error.errors.map((e) => _.pick(e, ['path', 'message', 'value'])),
          });
        } else {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
        }
      }
    }
  } else {
    res.status(StatusCodes.NOT_FOUND).end();
  }
});

export default router;
