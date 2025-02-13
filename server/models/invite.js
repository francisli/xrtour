import { Model } from 'sequelize';
import _ from 'lodash';
import mailer from '../emails/mailer.js';

export default function (sequelize, DataTypes) {
  class Invite extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Invite.belongsTo(models.User, { as: 'AcceptedByUser' });
      Invite.belongsTo(models.User, { as: 'RevokedByUser' });
      Invite.belongsTo(models.User, { as: 'CreatedByUser' });
      Invite.hasMany(models.Membership);
    }

    toJSON() {
      const json = _.pick(this.get(), [
        'id',
        'firstName',
        'lastName',
        'email',
        'message',
        'createdAt',
        'CreatedByUserId',
        'acceptedAt',
        'AcceptedByUserId',
        'revokedAt',
        'RevokedByUserId',
        'updatedAt',
      ]);
      return json;
    }

    sendInviteEmail() {
      return mailer.send({
        template: 'invite',
        message: {
          to: this.fullNameAndEmail,
        },
        locals: {
          firstName: this.firstName,
          url: `${process.env.BASE_URL}/invites/${this.id}`,
          message: this.message,
        },
      });
    }

    sendTeamInviteEmail(team) {
      return mailer.send({
        template: 'teamInvite',
        message: {
          to: this.email,
        },
        locals: {
          teamName: team.name,
          url: `${process.env.BASE_URL}/invites/${this.id}`,
        },
      });
    }
  }

  Invite.init(
    {
      firstName: {
        type: DataTypes.STRING,
      },
      lastName: {
        type: DataTypes.STRING,
      },
      email: {
        type: DataTypes.CITEXT,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Email cannot be blank',
          },
          notEmpty: {
            msg: 'Email cannot be blank',
          },
        },
      },
      fullName: {
        type: DataTypes.VIRTUAL,
        get() {
          return `${this.firstName ?? ''} ${this.lastName ?? ''}`.trim();
        },
      },
      fullNameAndEmail: {
        type: DataTypes.VIRTUAL,
        get() {
          return `${this.fullName} <${this.email}>`.trim();
        },
      },
      message: DataTypes.TEXT,
      acceptedAt: DataTypes.DATE,
      revokedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Invite',
    }
  );
  return Invite;
}
