/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Versions', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      TourId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 'Tours',
          key: 'id',
        },
      },
      isStaging: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
      },
      isLive: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
      },
      passwordHash: {
        type: Sequelize.STRING,
      },
      data: {
        allowNull: false,
        type: Sequelize.JSONB,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX "versions__tour_id__is_staging" ON "Versions" ("TourId", "isStaging") WHERE "isLive" = TRUE'
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Versions');
  },
};
