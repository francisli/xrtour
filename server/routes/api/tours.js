import express from 'express';
import { StatusCodes } from 'http-status-codes';
import _ from 'lodash';

import helpers from '../helpers.js';
import interceptors from '../interceptors.js';
import models from '../../models/index.js';

import tourStopsRouter from './tourStops.js';

const router = express.Router();

router.get('/', interceptors.requireLogin, async (req, res) => {
  const { page = '1', show = 'active', TeamId } = req.query;
  const team = await models.Team.findByPk(TeamId);
  const membership = await team.getMembership(req.user);
  if (!membership) {
    res.status(StatusCodes.UNAUTHORIZED).end();
    return;
  }
  const options = {
    include: [{ model: models.Resource, as: 'CoverResource', include: 'Files' }],
    page,
    order: [['name', 'ASC']],
    where: { TeamId },
  };
  if (show === 'active') {
    options.where.archivedAt = null;
  } else if (show === 'archived') {
    options.where.archivedAt = { [models.Sequelize.Op.ne]: null };
  }
  const { records, pages, total } = await models.Tour.paginate(options);
  helpers.setPaginationHeaders(req, res, page, pages, total);
  res.json(records.map((record) => record.toJSON()));
});

router.post('/', interceptors.requireLogin, async (req, res) => {
  const { TeamId } = req.body;
  const team = await models.Team.findByPk(TeamId);
  const membership = await team.getMembership(req.user);
  if (!membership || !membership.isEditor) {
    res.status(StatusCodes.UNAUTHORIZED).end();
    return;
  }
  const record = models.Tour.build(_.pick(req.body, ['TeamId', 'link', 'names', 'descriptions', 'variants', 'visibility']));
  try {
    await record.save();
    res.status(StatusCodes.CREATED).json(record.toJSON());
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
});

router.use('/:TourId/stops', tourStopsRouter);

router.get('/:id', interceptors.requireLogin, async (req, res) => {
  const record = await models.Tour.findByPk(req.params.id, {
    include: [
      'Team',
      { model: models.Resource, as: 'CoverResource', include: 'Files' },
      {
        model: models.Stop,
        as: 'IntroStop',
        include: { model: models.StopResource, as: 'Resources', include: { model: models.Resource, include: 'Files' } },
      },
    ],
  });
  if (record) {
    const membership = await record.Team.getMembership(req.user);
    if (!membership) {
      res.status(StatusCodes.UNAUTHORIZED).end();
    } else {
      res.json(record.toJSON());
    }
  } else {
    res.status(StatusCodes.NOT_FOUND).end();
  }
});

router.patch('/:id', interceptors.requireLogin, async (req, res) => {
  const record = await models.Tour.findByPk(req.params.id, { include: 'Team' });
  if (record) {
    const membership = await record.Team.getMembership(req.user);
    if (!membership || !membership.isEditor) {
      res.status(StatusCodes.UNAUTHORIZED).end();
    } else {
      try {
        if (req.body.CoverResourceId) {
          const resource = await models.Resource.findOne({
            where: {
              id: req.body.CoverResourceId,
              TeamId: membership.TeamId,
            },
          });
          if (!resource) {
            res.status(StatusCodes.NOT_FOUND).end();
            return;
          }
        }
        if (req.body.IntroStopId) {
          const stop = await models.Stop.findOne({
            where: {
              id: req.body.IntroStopId,
              TeamId: membership.TeamId,
            },
          });
          if (!stop) {
            res.status(StatusCodes.NOT_FOUND).end();
            return;
          }
        }
        await record.update(
          _.pick(req.body, ['link', 'names', 'descriptions', 'variants', 'visibility', 'CoverResourceId', 'IntroStopId'])
        );
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

router.patch('/:id/restore', interceptors.requireLogin, async (req, res) => {
  let status = StatusCodes.INTERNAL_SERVER_ERROR;
  await models.sequelize.transaction(async (transaction) => {
    const record = await models.Tour.findByPk(req.params.id, { include: 'Team', transaction });
    if (!record) {
      status = StatusCodes.NOT_FOUND;
      return;
    }
    const membership = await record.Team.getMembership(req.user, { transaction });
    if (!membership || !membership.isEditor) {
      status = StatusCodes.FORBIDDEN;
      return;
    }
    try {
      await record.restore({ transaction });
      status = StatusCodes.NO_CONTENT;
    } catch (error) {
      console.log(error);
    }
  });
  res.status(status).end();
});

router.delete('/:id', interceptors.requireLogin, async (req, res) => {
  const { isPermanent = 'false' } = req.query;
  let status = StatusCodes.INTERNAL_SERVER_ERROR;
  await models.sequelize.transaction(async (transaction) => {
    const record = await models.Tour.findByPk(req.params.id, { include: 'Team', transaction });
    if (!record) {
      status = StatusCodes.NOT_FOUND;
      return;
    }
    const membership = await record.Team.getMembership(req.user, { transaction });
    if (!membership || !membership.isEditor) {
      status = StatusCodes.FORBIDDEN;
      return;
    }
    try {
      await record.delete({ isPermanent: isPermanent === 'true', transaction });
      status = StatusCodes.NO_CONTENT;
    } catch (error) {
      console.log(error);
    }
  });
  res.status(status).end();
});

export default router;
