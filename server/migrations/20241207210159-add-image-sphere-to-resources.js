/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`ALTER TYPE "enum_Resources_type" ADD VALUE 'IMAGE_SPHERE' AFTER 'IMAGE_OVERLAY'`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`UPDATE "Resources" SET type='IMAGE' WHERE type='IMAGE_SPHERE'`);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Resources_type" RENAME TO "enum_Resources_type_old";
      CREATE TYPE "enum_Resources_type" AS ENUM('AR_LINK', 'AUDIO', 'IMAGE', 'IMAGE_OVERLAY', 'LINK', 'VIDEO');
      ALTER TABLE "Resources" ALTER COLUMN type TYPE "enum_Resources_type" USING type::text::"enum_Resources_type";
      DROP TYPE "enum_Resources_type_old";
    `);
  },
};
