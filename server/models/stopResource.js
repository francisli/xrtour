import { Model } from 'sequelize';
import _ from 'lodash';

export default function (sequelize, DataTypes) {
  class StopResource extends Model {
    static associate(models) {
      StopResource.belongsTo(models.Stop);
      StopResource.belongsTo(models.Resource);
    }

    toJSON() {
      const json = _.pick(this.get(), ['id', 'StopId', 'ResourceId', 'start', 'end', 'pauseAtEnd', 'options']);
      if (this.Resource) {
        json.Resource = this.Resource.toJSON();
      }
      return json;
    }
  }
  StopResource.init(
    {
      start: DataTypes.INTEGER,
      end: DataTypes.INTEGER,
      pauseAtEnd: DataTypes.BOOLEAN,
      options: DataTypes.JSONB,
    },
    {
      sequelize,
      modelName: 'StopResource',
    }
  );
  return StopResource;
}
