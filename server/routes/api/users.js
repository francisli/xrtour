import express from 'express';
import { StatusCodes } from 'http-status-codes';
import _ from 'lodash';

import helpers from '../helpers.js';
import interceptors from '../interceptors.js';
import models from '../../models/index.js';

const router = express.Router();

router.get('/', interceptors.requireAdmin, async (req, res) => {
  const page = req.query.page || 1;
  const { records, pages, total } = await models.User.paginate({
    page,
    order: [
      ['lastName', 'ASC'],
      ['firstName', 'ASC'],
      ['email', 'ASC'],
    ],
  });
  helpers.setPaginationHeaders(req, res, page, pages, total);
  res.json(records.map((r) => r.toJSON()));
});

router.get('/me', async (req, res) => {
  if (req.user) {
    req.user.Memberships = await req.user.getMemberships({
      include: 'Team',
      order: [['Team', 'name', 'ASC']],
    });
    res.json(req.user.toJSON());
  } else {
    res.status(StatusCodes.NO_CONTENT).end();
  }
});

router.get('/:id', interceptors.requireLogin, async (req, res) => {
  if (!req.user.isAdmin && req.user.id !== req.params.id) {
    res.status(StatusCodes.UNAUTHORIZED).end();
    return;
  }
  try {
    const user = await models.User.findByPk(req.params.id);
    if (user) {
      res.json(user.toJSON());
    } else {
      res.status(StatusCodes.NOT_FOUND).end();
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
  }
});

router.patch('/:id', interceptors.requireLogin, (req, res) => {
  if (!req.user.isAdmin && req.user.id !== req.params.id) {
    res.status(StatusCodes.UNAUTHORIZED).end();
    return;
  }
  models.sequelize.transaction(async (transaction) => {
    try {
      const user = await models.User.findByPk(req.params.id, { transaction });
      if (!user) {
        res.status(StatusCodes.NOT_FOUND).end();
        return;
      }
      const attrs = ['firstName', 'lastName', 'email', 'password', 'picture'];
      if (req.user.isAdmin) {
        attrs.push('isAdmin');
      }
      await user.update(_.pick(req.body, attrs), { transaction });
      user.Memberships = await user.getMemberships({
        include: 'Team',
        order: [['Team', 'name', 'ASC']],
      });
      res.json(user.toJSON());
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
          status: StatusCodes.UNPROCESSABLE_ENTITY,
          errors: error.errors,
        });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
      }
    }
  });
});

export default router;
