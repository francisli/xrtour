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
        'name',
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

    async updateVariants(options) {
      const { transaction } = options ?? {};
      const tour = await sequelize.models.Tour.findByPk(this.id, {
        include: [
          'Team',
          { model: sequelize.models.Resource, as: 'CoverResource', include: 'Files' },
          {
            model: sequelize.models.Stop,
            as: 'IntroStop',
            include: {
              model: sequelize.models.StopResource,
              as: 'Resources',
              include: { model: sequelize.models.Resource, include: 'Files' },
            },
          },
          {
            model: sequelize.models.TourStop,
            include: [
              {
                model: sequelize.models.Stop,
                include: {
                  model: sequelize.models.StopResource,
                  as: 'Resources',
                  include: { model: sequelize.models.Resource, include: 'Files' },
                },
              },
              {
                model: sequelize.models.Stop,
                as: 'TransitionStop',
                include: {
                  model: sequelize.models.StopResource,
                  as: 'Resources',
                  include: { model: sequelize.models.Resource, include: 'Files' },
                },
              },
            ],
          },
        ],
        transaction,
      });
      const { variants } = this;
      const stops = [tour.IntroStop, ...tour.TourStops.flatMap((ts) => [ts.Stop, ts.TransitionStop])].filter(Boolean);
      await Promise.all(
        stops.map((s) => {
          for (const variant of variants) {
            if (!s.variants.find((v) => v.code === variant.code)) {
              s.variants = [...s.variants, variant];
              s.names = { ...s.names, [variant.code]: '' };
              s.descriptions = { ...s.descriptions, [variant.code]: '' };
            }
          }
          return s.save({ transaction });
        })
      );
      const resources = [tour.CoverResource, ...stops.flatMap((s) => s.Resources.map((sr) => sr.Resource))].filter(Boolean);
      await Promise.all(
        resources.map((r) => {
          const Files = [...r.Files];
          const promises = [];
          for (const variant of variants) {
            if (!r.variants.find((v) => v.code === variant.code)) {
              r.variants = [...r.variants, variant];
              promises.push(r.save({ transaction }));
            }
            if (!Files.find((f) => f.variant === variant.code)) {
              promises.push(
                sequelize.models.File.findOrCreate({
                  where: { variant: variant.code, ResourceId: r.id },
                  defaults: { variant: variant.code, ResourceId: r.id },
                  transaction,
                })
              );
            }
          }
          return Promise.all(promises);
        })
      );
    }

    async delete(options) {
      const { isPermanent = false, transaction } = options ?? {};
      const resourceIds = new Set();
      const stopIds = new Set();
      // helper function to check for and archive resource
      async function archiveResource(resource) {
        const tourIds = await resource.getReferencingTourIds({ transaction });
        if (tourIds.length === 1) {
          resourceIds.add(resource.id);
        }
      }
      // helper function to check for and archive stop
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
      // archive cover resource if it is only used by this Tour
      const resource = await this.getCoverResource({ transaction });
      if (resource) {
        await archiveResource(resource);
      }
      // archive intro stop if it is only used by this Tour
      const intro = await this.getIntroStop({ transaction });
      if (intro) {
        await archiveStop(intro);
      }
      // archive stops/transitions if they are only used by this Tour
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
      if (isPermanent) {
        // delete this tour's associations to stops
        await sequelize.models.TourStop.destroy({ where: { TourId: this.id }, transaction });
        // delete any published versions
        await sequelize.models.Version.destroy({ where: { TourId: this.id }, individualHooks: true, transaction });
        // delete this tour to release its references to cover resource and intro stop
        await this.destroy({ transaction });
        // delete collected resources
        await sequelize.models.StopResource.destroy({ where: { ResourceId: Array.from(resourceIds) }, transaction });
        await Promise.all(
          (
            await sequelize.models.Resource.findAll({ where: { id: Array.from(resourceIds) }, transaction })
          ).map(async (r) => {
            const files = await r.getFiles({ transaction });
            await Promise.all(files.map((f) => f.destroy({ transaction })));
            return r.destroy({ transaction });
          })
        );
        // delete collected stops
        await sequelize.models.StopResource.destroy({ where: { StopId: Array.from(stopIds) }, transaction });
        return Promise.all(
          (await sequelize.models.Stop.findAll({ where: { id: Array.from(stopIds) }, transaction })).map(async (s) =>
            s.destroy({ transaction })
          )
        );
      } else {
        // mark collected resources and stops as archived
        const archivedAt = new Date();
        await Promise.all(
          Array.from(resourceIds).map((id) => sequelize.models.Resource.update({ archivedAt }, { where: { id }, transaction }))
        );
        await Promise.all(Array.from(stopIds).map((id) => sequelize.models.Stop.update({ archivedAt }, { where: { id }, transaction })));
        // mark this tour as archived
        return this.update({ archivedAt }, { transaction });
      }
    }

    async restore(options) {
      const { transaction } = options ?? {};
      const archivedAt = null;
      // restore cover resource if it was archived
      const resource = await this.getCoverResource({ transaction });
      await resource?.restore({ transaction });
      // restore intro stop if it was archived
      const intro = await this.getIntroStop({ transaction });
      await intro?.restore({ transaction });
      // restore all stops/transitions if they were archived
      const tourStops = await this.getTourStops({
        include: [sequelize.models.Stop, { model: sequelize.models.Stop, as: 'TransitionStop' }],
        transaction,
      });
      await Promise.all(
        tourStops.map(async (ts) => {
          await ts.Stop?.restore({ transaction });
          await ts.TransitionStop?.restore({ transaction });
        })
      );
      // mark this stop as unarchived
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
    if (!record.name) {
      const [variant] = record.variants;
      record.name = record.names[variant.code] ?? '';
    }
  });

  return Tour;
}
