const crypto = require('crypto');
const _ = require('lodash');
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Version extends Model {
    static associate(models) {
      Version.belongsTo(models.Tour);
    }

    toJSON() {
      const json = _.pick(this.get(), ['id', 'TourId', 'isStaging', 'isLive', 'passwordHash', 'createdAt']);
      return json;
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
