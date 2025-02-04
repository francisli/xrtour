import { Model, Sequelize } from 'sequelize';
import _ from 'lodash';

export default function (sequelize, DataTypes) {
  class Resource extends Model {
    static associate(models) {
      Resource.belongsTo(models.Team);
      Resource.hasMany(models.File);
      Resource.hasMany(models.StopResource);
      Resource.hasMany(models.Tour, { as: 'CoveredTours', foreignKey: 'CoverResourceId' });
    }

    toJSON() {
      const json = _.pick(this.get(), ['id', 'TeamId', 'name', 'type', 'data', 'variants', 'createdAt', 'updatedAt', 'archivedAt']);
      if (this.Files) {
        json.Files = this.Files.map((f) => f.toJSON());
      }
      return json;
    }

    async getReferencingTourIds(options) {
      const { transaction } = options ?? {};
      const coveredTourIds = (
        await this.getCoveredTours({ attributes: [Sequelize.fn('DISTINCT', Sequelize.col('id'))], raw: true, transaction })
      ).map((row) => row.id);
      const stopIds = (
        await this.getStopResources({ attributes: [Sequelize.fn('DISTINCT', Sequelize.col('StopId'))], raw: true, transaction })
      ).map((row) => row.StopId);
      const tourIds = (
        await sequelize.models.TourStop.findAll({
          attributes: [Sequelize.fn('DISTINCT', Sequelize.col('TourId'))],
          where: { [Sequelize.Op.or]: { StopId: stopIds, TransitionStopId: stopIds } },
          raw: true,
          transaction,
        })
      ).map((row) => row.TourId);
      const introTourIds = (
        await sequelize.models.Tour.findAll({
          attributes: [Sequelize.fn('DISTINCT', Sequelize.col('id'))],
          where: { IntroStopId: stopIds },
          raw: true,
          transaction,
        })
      ).map((row) => row.id);
      const tourIdSet = new Set([...coveredTourIds, ...tourIds, ...introTourIds]);
      return Array.from(tourIdSet);
    }

    async archive(options) {
      const { transaction } = options ?? {};
      return this.update({ archivedAt: new Date() }, { transaction });
    }
  }

  Resource.init(
    {
      name: {
        allowNull: false,
        type: DataTypes.STRING,
        validate: {
          notNull: {
            msg: 'Name is required',
          },
          notEmpty: {
            msg: 'Name cannot be blank',
          },
        },
      },
      type: {
        allowNull: false,
        type: DataTypes.ENUM('3D_MODEL', 'AR_LINK', 'AUDIO', 'IMAGE', 'IMAGE_OVERLAY', 'IMAGE_SPHERE', 'LINK', 'VIDEO'),
        validate: {
          notNull: {
            msg: 'Type is required',
          },
          notEmpty: {
            msg: 'Type cannot be blank',
          },
        },
      },
      data: DataTypes.JSONB,
      variants: DataTypes.JSONB,
      archivedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Resource',
    }
  );
  return Resource;
}
