/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Teams', 'colorPrimary', {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn('Teams', 'colorSecondary', {
      type: Sequelize.STRING,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Teams', 'colorPrimary');
    await queryInterface.removeColumn('Teams', 'colorSecondary');
  },
};
