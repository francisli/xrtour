import { Model, Op } from 'sequelize';
import _ from 'lodash';

export default function (sequelize, DataTypes) {
  class Tour extends Model {
    static associate(models) {
      Tour.belongsTo(models.Team);
      Tour.belongsTo(models.Resource, { as: 'CoverResource' });
      Tour.belongsTo(models.Stop, { as: 'IntroStop' });
      Tour.hasMany(models.TourStop);
      Tour.hasMany(models.Version);
    }

    toJSON() {
      const json = _.pick(this.get(), [
        'id',
        'TeamId',
        'CoverResourceId',
        'IntroStopId',
        'link',
        'names',
        'descriptions',
        'variants',
        'visibility',
        'createdAt',
        'updatedAt',
        'archivedAt',
      ]);
      if (this.CoverResource) {
        json.CoverResource = this.CoverResource.toJSON();
      }
      if (this.IntroStop) {
        json.IntroStop = this.IntroStop.toJSON();
      }
      if (this.Team) {
        json.Team = this.Team.toJSON();
      }
      if (this.TourStops) {
        json.TourStops = this.TourStops.map((ts) => ts.toJSON());
      }
      return json;
    }

    async archive(options) {
      const { transaction } = options ?? {};
      const resourceIds = new Set();
      const stopIds = new Set();
      // archive cover resource if it is only used by this Tour
      async function archiveResource(resource) {
        const tourIds = await resource.getReferencingTourIds({ transaction });
        if (tourIds.length === 1) {
          resourceIds.add(resource.id);
        }
      }
      const resource = await this.getCoverResource({ transaction });
      if (resource) {
        await archiveResource(resource);
      }
      // archive intro stop if it is only used by this Tour
      async function archiveStop(stop) {
        const tourIds = await stop.getReferencingTourIds({ transaction });
        if (tourIds.length === 1) {
          // archive stop resources if they are only used by this Tour
          const stopResources = await stop.getResources({
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
          stopIds.add(stop.id);
        }
      }
      const intro = await this.getIntroStop({ transaction });
      if (intro) {
        await archiveStop(intro);
      }
      // archive stops if they are only used by this Tour
      const tourStops = await this.getTourStops({
        include: [sequelize.models.Stop, { model: sequelize.models.Stop, as: 'TransitionStop' }],
        transaction,
      });
      await Promise.all(
        tourStops.map(async (ts) => {
          if (ts.Stop) {
            await archiveStop(ts.Stop);
          }
          if (ts.TransitionStop) {
            await archiveStop(ts.TransitionStop);
          }
        })
      );
      // mark collected resources and stops as archived
      const archivedAt = new Date();
      await Promise.all(
        Array.from(resourceIds).map((id) => sequelize.models.Resource.update({ archivedAt }, { where: { id }, transaction }))
      );
      await Promise.all(Array.from(stopIds).map((id) => sequelize.models.Stop.update({ archivedAt }, { where: { id }, transaction })));
      return this.update({ archivedAt }, { transaction });
    }
  }

  Tour.init(
    {
      link: {
        type: DataTypes.CITEXT,
        validate: {
          notEmpty: {
            msg: 'Link cannot be blank',
          },
          async isUnique(value) {
            if (this.changed('link')) {
              const record = await Tour.findOne({
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
      visibility: DataTypes.ENUM('PUBLIC', 'UNLISTED', 'PRIVATE'),
      archivedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Tour',
    }
  );

  Tour.beforeValidate((record) => {
    const [variant] = record.variants;
    record.name = record.names[variant.code] ?? '';
  });

  return Tour;
}
