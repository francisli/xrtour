const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Team extends Model {
    static associate(models) {
      Team.hasMany(models.Membership);
    }
  }

  Team.init(
    {
      name: DataTypes.STRING,
      link: DataTypes.CITEXT,
      variants: DataTypes.JSONB,
    },
    {
      sequelize,
      modelName: 'Team',
    }
  );

  return Team;
};
