import { Model, Op, Sequelize } from 'sequelize';
import _ from 'lodash';

export default function (sequelize, DataTypes) {
  class Stop extends Model {
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

    async archive(options) {
      const { transaction } = options ?? {};
      return this.update({ archivedAt: new Date() }, { transaction });
    }

    toJSON() {
      const json = _.pick(this.get(), [
        'id',
        'TeamId',
        'type',
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
    const [variant] = record.variants ?? [];
    if (variant) {
      record.name = record.names[variant.code] ?? '';
    }
  });

  return Stop;
}
