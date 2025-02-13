import express from 'express';
import { StatusCodes } from 'http-status-codes';
import _ from 'lodash';
import { Op } from 'sequelize';

import helpers from '../helpers.js';
import interceptors from '../interceptors.js';
import models from '../../models/index.js';

const router = express.Router();

router.get('/', interceptors.requireLogin, async (req, res) => {
  const { page = '1', TeamId, type, search, show = 'active' } = req.query;
  const team = await models.Team.findByPk(TeamId);
  const membership = await team.getMembership(req.user);
  if (!membership) {
    res.status(StatusCodes.UNAUTHORIZED).end();
    return;
  }
  const options = {
    page,
    include: 'Files',
    order: [['name', 'ASC']],
    where: { TeamId },
  };
  if (show === 'active') {
    options.where.archivedAt = null;
  } else if (show === 'archived') {
    options.where.archivedAt = { [Op.ne]: null };
  }
  if (type) {
    options.where.type = type;
  }
  if (search && search.trim() !== '') {
    options.where.name = {
      [Op.iLike]: `%${search.trim()}%`,
    };
  }
  const { records, pages, total } = await models.Resource.paginate(options);
  helpers.setPaginationHeaders(req, res, page, pages, total);
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
  let record = models.Resource.build(_.pick(req.body, ['TeamId', 'name', 'type', 'data', 'variants']));
  try {
    await models.sequelize.transaction(async (transaction) => {
      await record.save({ transaction });
      if (req.body.Files) {
        const files = req.body.Files.map((f) =>
          models.File.create(
            {
              ..._.pick(f, ['variant', 'externalURL', 'key', 'originalName', 'duration', 'width', 'height']),
              ResourceId: record.id,
            },
            { transaction }
          )
        );
        await Promise.all(files);
      }
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
        status: StatusCodes.UNPROCESSABLE_ENTITY,
        errors: error.errors.map((e) => _.pick(e, ['path', 'message', 'value'])),
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    }
    record = null;
  }
  if (record) {
    res.status(StatusCodes.CREATED).json(record.toJSON());
  }
});

router.get('/:id', interceptors.requireLogin, async (req, res) => {
  const record = await models.Resource.findByPk(req.params.id, { include: ['Team', 'Files'] });
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
  const record = await models.Resource.findByPk(req.params.id, { include: 'Team' });
  if (record) {
    const membership = await record.Team.getMembership(req.user);
    if (!membership) {
      res.status(StatusCodes.UNAUTHORIZED).end();
    } else {
      try {
        await models.sequelize.transaction(async (transaction) => {
          await record.update(_.pick(req.body, ['name', 'type', 'data', 'variants']), { transaction });
          if (req.body.Files) {
            const files = req.body.Files.map((f) => {
              const attrs = _.pick(f, ['variant', 'externalURL', 'key', 'originalName', 'duration', 'width', 'height']);
              return f.id
                ? models.File.findOne({ where: { id: f.id, ResourceId: record.id }, transaction }).then((f2) =>
                    f2.update(attrs, { transaction })
                  )
                : models.File.create(
                    {
                      ...attrs,
                      ResourceId: record.id,
                    },
                    { transaction }
                  );
            });
            await Promise.all(files);
            record.Files = await record.getFiles({ transaction });
          }
        });
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

router.delete('/:id', interceptors.requireLogin, async (req, res) => {
  const record = await models.Resource.findByPk(req.params.id, { include: 'Team' });
  if (record) {
    const membership = await record.Team.getMembership(req.user);
    if (!membership) {
      res.status(StatusCodes.UNAUTHORIZED).end();
    } else {
      try {
        await models.sequelize.transaction(async (transaction) => {
          const files = await record.getFiles({ transaction });
          await Promise.all(files.map((f) => f.destroy({ transaction })));
          await record.destroy({ transaction });
        });
        res.status(StatusCodes.OK).end();
      } catch (error) {
        if (error.name === 'SequelizeForeignKeyConstraintError') {
          res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
            status: StatusCodes.UNPROCESSABLE_ENTITY,
            message: 'Unable to delete, still being used.',
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
