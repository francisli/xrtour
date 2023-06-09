const _ = require('lodash');
const { Model, Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Stop extends Model {
    static associate(models) {
      Stop.belongsTo(models.Team);
      Stop.hasMany(models.StopResource, { as: 'Resources' });
    }

    toJSON() {
      const json = _.pick(this.get(), [
        'id',
        'TeamId',
        'type',
        'link',
        'address',
        'coordinate',
        'radius',
        'destAddress',
        'destCoordinate',
        'destRadius',
        'names',
        'descriptions',
        'variants',
      ]);
      if (this.Resources) {
        json.Resources = this.Resources.map((sr) => sr.toJSON());
      }
      return json;
    }
  }
  Stop.init(
    {
      type: DataTypes.ENUM('INTRO', 'STOP', 'TRANSITION'),
      link: {
        type: DataTypes.CITEXT,
        validate: {
          notEmpty: {
            msg: 'Link cannot be blank',
          },
          async isUnique(value) {
            if (this.changed('link')) {
              const record = await Stop.findOne({
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
      address: DataTypes.TEXT,
      coordinate: DataTypes.GEOGRAPHY,
      radius: DataTypes.DECIMAL,
      destAddress: DataTypes.TEXT,
      destCoordinate: DataTypes.GEOGRAPHY,
      destRadius: DataTypes.DECIMAL,
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
    },
    {
      sequelize,
      modelName: 'Stop',
    }
  );

  Stop.beforeValidate((record) => {
    const [variant] = record.variants;
    record.name = record.names[variant.code] ?? '';
  });

  return Stop;
};
