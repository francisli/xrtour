import { Model, Op, Sequelize } from 'sequelize';
import _ from 'lodash';

export class StopReferencedError extends Error {
  constructor(tours) {
    super('Stop still referenced by Tours');
    this.tours = tours;
  }
}

export default function (sequelize, DataTypes) {
  class Stop extends Model {
    static ReferencedError = StopReferencedError;

    static associate(models) {
      Stop.belongsTo(models.Team);
      Stop.hasMany(models.StopResource, { as: 'Resources' });
      Stop.hasMany(models.Tour, { as: 'IntroducedTours', foreignKey: 'IntroStopId' });
      Stop.hasMany(models.TourStop);
      Stop.hasMany(models.TourStop, { as: 'TransitionedTourStops', foreignKey: 'TransitionStopId' });
    }

    async getReferencingTourIds(options) {
      const { transaction } = options ?? {};
      const introducedTourIds = (
        await this.getIntroducedTours({ attributes: [Sequelize.fn('DISTINCT', Sequelize.col('id'))], raw: true, transaction })
      ).map((row) => row.id);
      const tourIds = (
        await sequelize.models.TourStop.findAll({
          attributes: [Sequelize.fn('DISTINCT', Sequelize.col('TourId'))],
          where: { [Op.or]: { StopId: this.id, TransitionStopId: this.id } },
          raw: true,
          transaction,
        })
      ).map((row) => row.TourId);
      const tourIdSet = new Set([...introducedTourIds, ...tourIds]);
      return Array.from(tourIdSet);
    }

    async delete(options) {
      const { transaction, isPermanent = false } = options ?? {};
      const tourIds = await this.getReferencingTourIds({ transaction });
      if (tourIds.length > 0) {
        const tours = await sequelize.models.Tour.findAll({ where: { id: tourIds }, transaction });
        throw new StopReferencedError(tours);
      }
      // collect stop resources only used by this stop
      const resourceIds = new Set();
      async function archiveResource(resource) {
        const stopIds = await resource.getReferencingStopIds({ transaction });
        if (stopIds.length > 1) {
          return;
        }
        const tourIds = await resource.getReferencingTourIds({ transaction });
        if (tourIds.length === 0) {
          resourceIds.add(resource.id);
        }
      }
      const stopResources = await this.getResources({
        include: [sequelize.models.Resource],
        transaction,
      });
      await Promise.all(
        stopResources.map(async (sr) => {
          if (sr.Resource) {
            await archiveResource(sr.Resource);
          }
        })
      );
      if (isPermanent) {
        // delete collected resources
        await Promise.all(
          (
            await sequelize.models.Resource.findAll({ where: { id: Array.from(resourceIds) }, transaction })
          ).map(async (r) => {
            const files = await r.getFiles({ transaction });
            await Promise.all(files.map((f) => f.destroy({ transaction })));
            return r.destroy({ transaction });
          })
        );
        // delete this stop
        return this.destroy({ transaction });
      }
      const archivedAt = new Date();
      await Promise.all(
        Array.from(resourceIds).map((id) => sequelize.models.Resource.update({ archivedAt }, { where: { id }, transaction }))
      );
      return this.update({ archivedAt }, { transaction });
    }

    async restore(options) {
      const { transaction } = options ?? {};
      const archivedAt = null;
      const stopResources = await this.getResources({ transaction });
      const resourceIds = stopResources.map((sr) => sr.ResourceId);
      await sequelize.models.Resource.update({ archivedAt }, { where: { id: resourceIds }, transaction });
      return this.update({ archivedAt }, { transaction });
    }

    toJSON() {
      const json = _.pick(this.get(), [
        'id',
        'TeamId',
        'type',
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
        'createdAt',
        'updatedAt',
        'archivedAt',
      ]);
      if (this.Resources) {
        json.Resources = this.Resources.map((sr) => sr.toJSON());
      }
      return json;
    }
  }
  Stop.init(
    {
      type: DataTypes.ENUM('INTRO', 'STOP', 'TRANSITION'),
      link: {
        type: DataTypes.CITEXT,
        validate: {
          notEmpty: {
            msg: 'Link cannot be blank',
          },
          async isUnique(value) {
            if (this.changed('link')) {
              const record = await Stop.findOne({
                where: {
                  id: {
                    [Op.ne]: this.id,
                  },
                  TeamId: this.TeamId,
                  link: value,
                },
              });
              if (record) {
                throw new Error('Link already taken');
              }
            }
          },
          is: {
            args: [/^[A-Za-z0-9-]+$/],
            msg: 'Letters, numbers, and hyphen only',
          },
        },
      },
      address: DataTypes.TEXT,
      coordinate: DataTypes.GEOGRAPHY,
      radius: DataTypes.DECIMAL,
      destAddress: DataTypes.TEXT,
      destCoordinate: DataTypes.GEOGRAPHY,
      destRadius: DataTypes.DECIMAL,
      name: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: {
            msg: 'Name cannot be blank',
          },
        },
      },
      names: DataTypes.JSONB,
      descriptions: DataTypes.JSONB,
      variants: DataTypes.JSONB,
      archivedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Stop',
    }
  );

  Stop.beforeValidate((record) => {
    if (!record.name) {
      const [variant] = record.variants ?? [];
      if (variant) {
        record.name = record.names[variant.code] ?? '';
      }
    }
  });

  return Stop;
}
