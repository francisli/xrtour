const assert = require('assert');
const { StatusCodes } = require('http-status-codes');
const session = require('supertest-session');

const helper = require('../../helper');
const app = require('../../../app');
const models = require('../../../models');

describe('/api/versions', () => {
  let testSession;

  beforeEach(async () => {
    await helper.loadUploads([
      ['512x512.png', 'cdd8007d-dcaf-4163-b497-92d378679668.png'],
      ['00-04.m4a', 'd2e150be-b277-4f68-96c7-22a477e0022f.m4a'],
    ]);
    await helper.loadFixtures(['users', 'invites', 'teams', 'memberships', 'tours', 'resources', 'files', 'versions']);
    testSession = session(app);
    await testSession
      .post('/api/auth/login')
      .set('Accept', 'application/json')
      .send({ email: 'regular.user@test.com', password: 'abcd1234' })
      .expect(StatusCodes.OK);
  });

  afterEach(async () => {
    await helper.cleanAssets();
  });

  describe('GET /', () => {
    it('returns a list of Versions for a specified Tour', async () => {
      const response = await testSession
        .get('/api/versions?TourId=ae61f3e7-7de7-40e2-b9a1-c5ad9ff94806')
        .set('Accept', 'application/json')
        .expect(StatusCodes.OK);
      assert.deepStrictEqual(response.body.length, 2);
      assert.deepStrictEqual(response.body[0].id, '6e5fafaa-fa8e-4d46-a17a-38916f4b99e4');
      assert.deepStrictEqual(response.body[1].id, '2abf432a-9eb2-4bd9-86d9-12645c2d62c7');
    });

    it('returns a list of staging Versions for a specified Tour', async () => {
      const response = await testSession
        .get('/api/versions?TourId=ae61f3e7-7de7-40e2-b9a1-c5ad9ff94806&isStaging=true')
        .set('Accept', 'application/json')
        .expect(StatusCodes.OK);
      assert.deepStrictEqual(response.body.length, 1);
      assert.deepStrictEqual(response.body[0].id, '2abf432a-9eb2-4bd9-86d9-12645c2d62c7');
    });

    it('returns a list of production Versions for a specified Tour', async () => {
      const response = await testSession
        .get('/api/versions?TourId=ae61f3e7-7de7-40e2-b9a1-c5ad9ff94806&isStaging=false')
        .set('Accept', 'application/json')
        .expect(StatusCodes.OK);
      assert.deepStrictEqual(response.body.length, 1);
      assert.deepStrictEqual(response.body[0].id, '6e5fafaa-fa8e-4d46-a17a-38916f4b99e4');
    });
  });

  describe('POST /', () => {
    it('creates a new Version', async () => {
      const data = {
        TourId: 'ae61f3e7-7de7-40e2-b9a1-c5ad9ff94806',
        isStaging: false,
      };
      const response = await testSession.post('/api/versions').set('Accept', 'application/json').send(data).expect(StatusCodes.CREATED);

      assert(response.body?.id);
      assert.deepStrictEqual(response.body, {
        ...data,
        id: response.body.id,
        isLive: true,
        passwordHash: null,
        createdAt: response.body.createdAt,
      });

      const record = await models.Version.findByPk(response.body.id);
      assert(record);
      assert.deepStrictEqual(record.isLive, true);
      assert.deepStrictEqual(record.isStaging, false);
    });

    it('replaces any prior live Version', async () => {
      const data = {
        TourId: 'ae61f3e7-7de7-40e2-b9a1-c5ad9ff94806',
        isStaging: true,
      };
      const response = await testSession.post('/api/versions').set('Accept', 'application/json').send(data).expect(StatusCodes.CREATED);

      assert(response.body?.id);
      assert.deepStrictEqual(response.body, {
        ...data,
        id: response.body.id,
        isLive: true,
        passwordHash: null,
        createdAt: response.body.createdAt,
      });

      const record = await models.Version.findByPk(response.body.id);
      assert(record);
      assert.deepStrictEqual(record.isLive, true);
      assert.deepStrictEqual(record.isStaging, true);

      const prevRecord = await models.Version.findByPk('2abf432a-9eb2-4bd9-86d9-12645c2d62c7');
      assert.deepStrictEqual(prevRecord?.isLive, false);
    });
  });

  describe('GET /:id', () => {
    it('returns a Version by id', async () => {
      const response = await testSession
        .get('/api/versions/6e5fafaa-fa8e-4d46-a17a-38916f4b99e4')
        .set('Accept', 'application/json')
        .expect(StatusCodes.OK);

      const data = { ...response.body };
      assert.deepStrictEqual(data, {
        id: '6e5fafaa-fa8e-4d46-a17a-38916f4b99e4',
        TourId: 'ae61f3e7-7de7-40e2-b9a1-c5ad9ff94806',
        isStaging: false,
        isLive: false,
        passwordHash: null,
        createdAt: '2022-01-29T22:58:56.000Z',
      });
    });
  });
});
