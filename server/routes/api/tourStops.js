const express = require('express');
const { StatusCodes } = require('http-status-codes');
const _ = require('lodash');

const models = require('../../models');
const interceptors = require('../interceptors');

const router = express.Router({ mergeParams: true });

router.get('/', interceptors.requireLogin, async (req, res) => {
  const { TourId } = req.params;
  const record = await models.Tour.findByPk(TourId, {
    include: ['Team', { model: models.TourStop, include: 'Stop' }],
  });
  if (record) {
    const membership = await record.Team.getMembership(req.user);
    if (!membership) {
      res.status(StatusCodes.UNAUTHORIZED).end();
    } else {
      // sort resources by start and name
      record.TourStops.sort((ts1, ts2) => Math.sign(ts1.position - ts2.position));
      res.json(record.TourStops.map((ts) => ts.toJSON()));
    }
  } else {
    res.status(StatusCodes.NOT_FOUND).end();
  }
});

router.post('/', interceptors.requireLogin, async (req, res) => {
  const { TourId } = req.params;
  const record = await models.Tour.findByPk(TourId, {
    include: ['Team'],
  });
  const stop = await models.Stop.findOne({
    where: {
      id: req.body.StopId,
      TeamId: record?.TeamId,
    },
  });
  if (record && stop) {
    const membership = await record.Team.getMembership(req.user);
    if (!membership || !membership.isEditor) {
      res.status(StatusCodes.UNAUTHORIZED).end();
    } else {
      try {
        const newRecord = await models.TourStop.create({
          TourId,
          ..._.pick(req.body, ['StopId', 'position']),
        });
        newRecord.Stop = stop;
        res.status(StatusCodes.CREATED).json(newRecord.toJSON());
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

router.patch('/:id', interceptors.requireLogin, async (req, res) => {
  const { id, TourId } = req.params;
  let record;
  let updatedRecord;
  let membership;
  try {
    await models.sequelize.transaction(async (transaction) => {
      record = await models.Tour.findByPk(TourId, {
        include: ['Team'],
        transaction,
      });
      updatedRecord = await models.TourStop.findOne({
        where: { id, TourId },
        transaction,
      });
      if (record && updatedRecord) {
        membership = await record.Team.getMembership(req.user);
        if (membership && membership.isEditor) {
          await updatedRecord.update(_.pick(req.body, ['position']));
        } else {
          membership = null;
        }
      }
    });
    if (record && updatedRecord) {
      if (!membership) {
        res.status(StatusCodes.UNAUTHORIZED).end();
      } else {
        res.json(updatedRecord.toJSON());
      }
    } else {
      res.status(StatusCodes.NOT_FOUND).end();
    }
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

router.delete('/:id', interceptors.requireLogin, async (req, res) => {
  const { id, TourId } = req.params;
  let record;
  let updatedRecord;
  let membership;
  try {
    await models.sequelize.transaction(async (transaction) => {
      record = await models.Tour.findByPk(TourId, {
        include: ['Team'],
        transaction,
      });
      updatedRecord = await models.TourStop.findOne({
        where: { id, TourId },
        transaction,
      });
      if (record && updatedRecord) {
        membership = await record.Team.getMembership(req.user);
        if (membership && membership.isEditor) {
          await updatedRecord.destroy();
        } else {
          membership = null;
        }
      }
    });
    if (record && updatedRecord) {
      if (!membership) {
        res.status(StatusCodes.UNAUTHORIZED).end();
      } else {
        res.status(StatusCodes.NO_CONTENT).end();
      }
    } else {
      res.status(StatusCodes.NOT_FOUND).end();
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
  }
});

module.exports = router;