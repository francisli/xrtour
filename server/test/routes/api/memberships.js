const assert = require('assert');
const { StatusCodes } = require('http-status-codes');
const session = require('supertest-session');

const helper = require('../../helper');
const app = require('../../../app');
const models = require('../../../models');

describe('/api/teams', () => {
  let testSession;

  beforeEach(async () => {
    await helper.loadFixtures(['users', 'teams', 'memberships']);
    testSession = session(app);
    await testSession
      .post('/api/auth/login')
      .set('Accept', 'application/json')
      .send({ email: 'regular.user@test.com', password: 'abcd1234' })
      .expect(StatusCodes.OK);
  });

  describe('POST /', () => {
    it('adds an existing User to a Team', async () => {
      const response = await testSession
        .post('/api/memberships')
        .set('Accept', 'application/json')
        .send({
          TeamId: '1a93d46d-89bf-463b-ab23-8f22f5777907',
          email: 'Admin.user@test.com',
          role: 'EDITOR',
        })
        .expect(StatusCodes.CREATED);

      assert.deepStrictEqual(response.body, {
        id: response.body?.id,
        TeamId: '1a93d46d-89bf-463b-ab23-8f22f5777907',
        UserId: '552be152-a88b-43c0-b009-1a087caad67a',
        role: 'EDITOR',
      });

      const record = await models.Membership.findByPk(response.body.id);
      assert(record);
      assert.deepStrictEqual(record.TeamId, '1a93d46d-89bf-463b-ab23-8f22f5777907');
      assert.deepStrictEqual(record.UserId, '552be152-a88b-43c0-b009-1a087caad67a');
      assert.deepStrictEqual(record.role, 'EDITOR');
    });
  });

  describe('PATCH /:id', () => {
    it('updates a Membership', async () => {
      await testSession
        .patch('/api/memberships/886304d3-cb45-442f-8914-f7fad8b6781a')
        .send({
          role: 'EDITOR',
        })
        .set('Accept', 'application/json')
        .expect(StatusCodes.OK);

      const record = await models.Membership.findByPk('886304d3-cb45-442f-8914-f7fad8b6781a');
      assert.deepStrictEqual(record.role, 'EDITOR');
    });
  });

  describe('DELETE /:id', () => {
    it('deletes a Membership', async () => {
      await testSession
        .delete('/api/memberships/886304d3-cb45-442f-8914-f7fad8b6781a')
        .set('Accept', 'application/json')
        .expect(StatusCodes.NO_CONTENT);

      const record = await models.Membership.findByPk('886304d3-cb45-442f-8914-f7fad8b6781a');
      assert.deepStrictEqual(record, null);
    });
  });
});
