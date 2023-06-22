const crypto = require('crypto');
const _ = require('lodash');
const path = require('path');
const { Model } = require('sequelize');
const { v4: uuid } = require('uuid');

const s3 = require('../lib/s3');

module.exports = (sequelize, DataTypes) => {
  class Version extends Model {
    static associate(models) {
      Version.belongsTo(models.Tour);
    }

    toJSON() {
      const json = _.pick(this.get(), ['id', 'TourId', 'isStaging', 'isLive', 'passwordHash', 'createdAt']);
      return json;
    }

    async publish(options = {}) {
      const { transaction } = options;
      if (!this.id) {
        this.id = uuid();
      }
      const tour = await sequelize.models.Tour.findByPk(this.TourId, {
        include: [
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
      let data = JSON.stringify(tour.toJSON());
      // find all file asset urls
      const regex = /"URL":"\/api\/assets\/(files\/[a-f0-9-]+\/key\/[^"]+)"/g;
      const matches = data.matchAll(regex);
      // copy to new versioned paths
      const assetPrefix = process.env.ASSET_PATH_PREFIX || '';
      await Promise.all(
        Array.from(matches, (m) =>
          s3.copyObject(path.join(process.env.AWS_S3_BUCKET, assetPrefix, m[1]), path.join(assetPrefix, 'versions', this.id, m[1]))
        )
      );
      // rewrite urls
      data = data.replace(regex, (m, p1) => `"URL":"/api/assets/${path.join('versions', this.id, p1)}"`);
      this.data = JSON.parse(data);
      return this.save({ transaction });
    }
  }

  Version.init(
    {
      isStaging: DataTypes.BOOLEAN,
      isLive: DataTypes.BOOLEAN,
      password: {
        type: DataTypes.VIRTUAL(DataTypes.STRING),
        set(value) {
          this.setDataValue('passwordHash', crypto.createHash('sha256').update(value).digest('hex'));
        },
      },
      passwordHash: DataTypes.STRING,
      data: DataTypes.JSONB,
    },
    {
      sequelize,
      modelName: 'Version',
    }
  );
  return Version;
};
