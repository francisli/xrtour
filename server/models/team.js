const _ = require('lodash');
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Team extends Model {
    static associate(models) {
      Team.hasMany(models.Membership);
    }

    toJSON() {
      const json = _.pick(this.get(), ['id', 'link', 'name', 'variants']);
      if (this.Memberships) {
        json.Memberships = this.Memberships.map((m) => m.toJSON());
      }
      return json;
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
