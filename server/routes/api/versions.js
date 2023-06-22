const express = require('express');
const { StatusCodes } = require('http-status-codes');
const _ = require('lodash');

const helpers = require('../helpers');
const models = require('../../models');
const interceptors = require('../interceptors');

const router = express.Router();

router.get('/', interceptors.requireLogin, async (req, res) => {
  const { page = '1', TourId, isStaging } = req.query;
  const tour = await models.Tour.findByPk(TourId, {
    include: 'Team',
  });
  const membership = await tour.Team.getMembership(req.user);
  if (!membership) {
    res.status(StatusCodes.UNAUTHORIZED).end();
    return;
  }
  const options = {
    page,
    order: [['createdAt', 'DESC']],
    where: { TourId },
  };
  if (isStaging !== undefined) {
    options.where.isStaging = isStaging === 'true';
  }
  const { records, pages, total } = await models.Version.paginate(options);
  helpers.setPaginationHeaders(req, res, options.page, pages, total);
  res.json(records.map((record) => record.toJSON()));
});

router.post('/', interceptors.requireLogin, async (req, res) => {
  const { TourId, isStaging } = req.body;
  const tour = await models.Tour.findByPk(TourId, {
    include: 'Team',
  });
  const membership = await tour.Team.getMembership(req.user);
  if (!membership || !membership.isEditor) {
    res.status(StatusCodes.UNAUTHORIZED).end();
    return;
  }
  const record = models.Version.build({
    ..._.pick(req.body, ['TourId', 'isStaging', 'password']),
    isLive: true,
  });
  record.data = {};
  try {
    await models.sequelize.transaction(async (transaction) => {
      await models.Version.update(
        { isLive: false },
        {
          where: {
            TourId,
            isStaging,
          },
          transaction,
        }
      );
      await record.save({ transaction });
    });
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

router.get('/:id', interceptors.requireLogin, async (req, res) => {
  const record = await models.Version.findByPk(req.params.id, {
    include: { model: models.Tour, include: 'Team' },
  });
  if (record) {
    const membership = await record.Tour.Team.getMembership(req.user);
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
  const record = await models.Version.findByPk(req.params.id, { include: { model: models.Tour, include: 'Team' } });
  if (record) {
    const membership = await record.Tour.Team.getMembership(req.user);
    if (!membership || !membership.isEditor) {
      res.status(StatusCodes.UNAUTHORIZED).end();
    } else {
      try {
        await record.update(_.pick(req.body, ['isStaging', 'isLive', 'password']));
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

module.exports = router;
