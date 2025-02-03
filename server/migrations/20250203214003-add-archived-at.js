/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Tours', 'archivedAt', Sequelize.DATE);
    await queryInterface.addColumn('Stops', 'archivedAt', Sequelize.DATE);
    await queryInterface.addColumn('Resources', 'archivedAt', Sequelize.DATE);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Resources', 'archivedAt');
    await queryInterface.removeColumn('Stops', 'archivedAt');
    await queryInterface.removeColumn('Tours', 'archivedAt');
  },
};
