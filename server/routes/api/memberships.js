const express = require('express');
const { StatusCodes } = require('http-status-codes');
const _ = require('lodash');

const models = require('../../models');
const interceptors = require('../interceptors');

const router = express.Router();

router.post('/', interceptors.requireLogin, async (req, res) => {
  const { TeamId, email, role } = req.body;
  const team = await models.Team.findByPk(TeamId);
  const membership = await team?.getMembership(req.user);
  if (membership?.isOwner) {
    try {
      const user = await models.User.findOne({ where: { email } });
      if (user) {
        const record = await models.Membership.create({ TeamId, UserId: user.id, role });
        res.status(StatusCodes.CREATED).json(record.toJSON());
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
  } else {
    res.status(StatusCodes.UNAUTHORIZED).end();
  }
});

router.patch('/:id', interceptors.requireLogin, async (req, res) => {
  let record;
  let membership;
  try {
    await models.sequelize.transaction(async (transaction) => {
      record = await models.Membership.findByPk(req.params.id, {
        include: ['Team', 'User'],
        transaction,
      });
      membership = await record.Team.getMembership(req.user, { transaction });
      if (membership?.isOwner) {
        await record.update(_.pick(req.body, ['role']), { transaction });
      }
    });
    if (record) {
      if (membership?.isOwner) {
        res.json(record.toJSON());
      } else {
        res.status(StatusCodes.UNAUTHORIZED).end();
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
  let record;
  let membership;
  try {
    await models.sequelize.transaction(async (transaction) => {
      record = await models.Membership.findByPk(req.params.id, {
        include: ['Team', 'User'],
        transaction,
      });
      membership = await record.Team.getMembership(req.user, { transaction });
      if (membership?.isOwner) {
        await record.destroy({ transaction });
      }
    });
    if (record) {
      if (membership?.isOwner) {
        res.status(StatusCodes.NO_CONTENT).end();
      } else {
        res.status(StatusCodes.UNAUTHORIZED).end();
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

module.exports = router;
