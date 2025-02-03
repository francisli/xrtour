import { Model } from 'sequelize';
import _ from 'lodash';

export default function (sequelize, DataTypes) {
  class Resource extends Model {
    static associate(models) {
      Resource.belongsTo(models.Team);
      Resource.hasMany(models.File);
      Resource.hasMany(models.StopResource);
    }

    toJSON() {
      const json = _.pick(this.get(), ['id', 'TeamId', 'name', 'type', 'data', 'variants', 'createdAt', 'updatedAt', 'archivedAt']);
      if (this.Files) {
        json.Files = this.Files.map((f) => f.toJSON());
      }
      return json;
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
