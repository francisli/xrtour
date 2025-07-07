/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Teams', 'font', {
      type: Sequelize.JSONB,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Teams', 'font');
  },
};
