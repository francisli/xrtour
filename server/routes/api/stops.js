import express from 'express';
import { StatusCodes } from 'http-status-codes';
import _ from 'lodash';
import { Op } from 'sequelize';

import helpers from '../helpers.js';
import interceptors from '../interceptors.js';
import { translateText } from '../../lib/translate.js';
import models from '../../models/index.js';

import stopResourcesRouter from './stopResources.js';

const router = express.Router();

router.get('/', interceptors.requireLogin, async (req, res) => {
  const { page = '1', TeamId, type = 'STOP', show, search } = req.query;
  const team = await models.Team.findByPk(TeamId);
  const membership = await team?.getMembership(req.user);
  if (!membership) {
    res.status(StatusCodes.UNAUTHORIZED).end();
    return;
  }
  const options = {
    include: { model: models.StopResource, as: 'Resources', include: { model: models.Resource, include: 'Files' } },
    page,
    order: [['name', 'ASC']],
    where: { TeamId, type },
  };
  if (show === 'active') {
    options.where.archivedAt = null;
  } else if (show === 'archived') {
    options.where.archivedAt = { [models.Sequelize.Op.ne]: null };
  }
  if (search && search.trim() !== '') {
    options.where.name = {
      [Op.iLike]: `%${search.trim()}%`,
    };
  }
  const { records, pages, total } = await models.Stop.paginate(options);
  helpers.setPaginationHeaders(req, res, options.page, pages, total);
  res.json(records.map((record) => record.toJSON()));
});

router.post('/', interceptors.requireLogin, async (req, res) => {
  const { TeamId } = req.body;
  const team = await models.Team.findByPk(TeamId);
  const membership = await team.getMembership(req.user);
  if (!membership) {
    res.status(StatusCodes.UNAUTHORIZED).end();
    return;
  }
  const record = models.Stop.build(
    _.pick(req.body, [
      'TeamId',
      'type',
      'link',
      'address',
      'coordinate',
      'radius',
      'destAddress',
      'destCoordinate',
      'destRadius',
      'name',
      'names',
      'descriptions',
      'variants',
    ])
  );
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

router.use('/:StopId/resources', stopResourcesRouter);

router.get('/:id/translate', interceptors.requireLogin, async (req, res) => {
  const record = await models.Stop.findByPk(req.params.id, {
    include: ['Team'],
  });
  if (record) {
    const membership = await record.Team.getMembership(req.user);
    if (!membership) {
      res.status(StatusCodes.UNAUTHORIZED).end();
    } else {
      const source = record.variants[0].code;
      const { target } = req.query;
      if (!target) {
        res.status(StatusCodes.BAD_REQUEST).end();
        return;
      }
      const name = await translateText(record.names[source], source, target);
      const description = await translateText(record.descriptions[source], source, target);
      res.json({
        name,
        description,
      });
    }
  } else {
    res.status(StatusCodes.NOT_FOUND).end();
  }
});

router.get('/:id', interceptors.requireLogin, async (req, res) => {
  const record = await models.Stop.findByPk(req.params.id, {
    include: ['Team'],
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
  const record = await models.Stop.findByPk(req.params.id, { include: 'Team' });
  if (record) {
    const membership = await record.Team.getMembership(req.user);
    if (!membership) {
      res.status(StatusCodes.UNAUTHORIZED).end();
    } else {
      try {
        await record.update(
          _.pick(req.body, [
            'name',
            'link',
            'address',
            'coordinate',
            'radius',
            'destAddress',
            'destCoordinate',
            'destRadius',
            'names',
            'descriptions',
            'variants',
            'visibility',
          ])
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
    const record = await models.Stop.findByPk(req.params.id, { include: 'Team', transaction });
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
    const record = await models.Stop.findByPk(req.params.id, { include: 'Team', transaction });
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
      if (error instanceof models.Stop.ReferencedError) {
        res.status(StatusCodes.CONFLICT).send(error.tours.map((t) => t.toJSON()));
        return;
      }
      console.log(error);
    }
  });
  res.status(status).end();
});

export default router;
