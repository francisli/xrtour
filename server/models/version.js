import crypto from 'crypto';
import { Model } from 'sequelize';
import _ from 'lodash';
import path from 'path';
import { v4 as uuid } from 'uuid';

import s3 from '../lib/s3.js';

function resourcesSortComparator(r1, r2) {
  let result = r1.Resource.type.localeCompare(r2.Resource.type);
  if (result === 0) {
    result = Math.sign(r1.start - r2.start);
    if (result === 0) {
      result = r1.Resource.name.localeCompare(r2.Resource.name);
    }
  }
  return result;
}

export default function (sequelize, DataTypes) {
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
      // get JSON representation
      let data = tour.toJSON();
      // sort stops
      data.TourStops?.sort((a, b) => Math.sign(a.position - b.position));
      // sort resources
      data.IntroStop?.Resources?.sort(resourcesSortComparator);
      data.TourStops?.forEach((ts) => {
        ts?.Stop?.Resources?.sort(resourcesSortComparator);
        ts?.TransitionStop?.Resources?.sort(resourcesSortComparator);
      });
      data = JSON.stringify(data);
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

  Version.afterDestroy((record, options) => {
    const assetPrefix = process.env.ASSET_PATH_PREFIX || '';
    const prefix = path.join(assetPrefix, 'versions', record.id);
    if (options.transaction) {
      options.transaction.afterCommit(() => s3.deleteObjects(prefix));
    } else {
      return s3.deleteObjects(prefix);
    }
  });

  return Version;
}
