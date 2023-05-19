const _ = require('lodash');
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Tour extends Model {
    static associate(models) {
      Tour.belongsTo(models.Team);
    }

    toJSON() {
      const json = _.pick(this.get(), ['id', 'TeamId', 'link', 'names', 'descriptions', 'variants', 'visibility']);
      return json;
    }
  }

  Tour.init(
    {
      link: DataTypes.CITEXT,
      name: DataTypes.STRING,
      names: DataTypes.JSONB,
      descriptions: DataTypes.JSONB,
      variants: DataTypes.JSONB,
      visibility: DataTypes.ENUM('PUBLIC', 'UNLISTED', 'PRIVATE'),
    },
    {
      sequelize,
      modelName: 'Tour',
    }
  );

  Tour.beforeValidate((record) => {
    const [variant] = record.variants;
    record.name = record.names[variant.code];
  });

  return Tour;
};
