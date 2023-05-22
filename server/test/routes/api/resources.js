const assert = require('assert');
const { StatusCodes } = require('http-status-codes');
const session = require('supertest-session');

const helper = require('../../helper');
const app = require('../../../app');
const models = require('../../../models');

describe('/api/resources', () => {
  let testSession;

  beforeEach(async () => {
    await helper.loadFixtures(['users', 'teams', 'memberships', 'resources']);
    testSession = session(app);
    await testSession
      .post('/api/auth/login')
      .set('Accept', 'application/json')
      .send({ email: 'regular.user@test.com', password: 'abcd1234' })
      .expect(StatusCodes.OK);
  });

  describe('GET /', () => {
    it('returns a list of Resources for a specified Team', async () => {
      const response = await testSession
        .get('/api/resources?TeamId=1a93d46d-89bf-463b-ab23-8f22f5777907')
        .set('Accept', 'application/json')
        .expect(StatusCodes.OK);
      assert(response.body.length, 2);
      assert.deepStrictEqual(response.body[0].name, 'Resource 1');
      assert.deepStrictEqual(response.body[1].name, 'Resource 2');
    });
  });

  describe('POST /', () => {
    it('creates a new Resource', async () => {
      const data = {
        TeamId: '1a93d46d-89bf-463b-ab23-8f22f5777907',
        name: 'New Resource',
        type: 'LINK',
        variants: [{ name: 'English (US)', displayName: 'English', code: 'en-us' }],
      };
      const response = await testSession.post('/api/resources').set('Accept', 'application/json').send(data).expect(StatusCodes.CREATED);

      assert(response.body?.id);
      assert.deepStrictEqual(response.body, { ...data, id: response.body.id });

      const record = await models.Resource.findByPk(response.body.id);
      assert(record);
      assert.deepStrictEqual(record.name, 'New Resource');
      assert.deepStrictEqual(record.type, 'LINK');
    });

    it('validates the presence of the Resource name', async () => {
      const response = await testSession
        .post('/api/resources')
        .set('Accept', 'application/json')
        .send({
          TeamId: '1a93d46d-89bf-463b-ab23-8f22f5777907',
          name: '',
          type: 'LINK',
          variants: [{ name: 'English (US)', displayName: 'English', code: 'en-us' }],
        })
        .expect(StatusCodes.UNPROCESSABLE_ENTITY);

      assert.deepStrictEqual(response.body, {
        errors: [
          {
            message: 'Name cannot be blank',
            path: 'name',
            value: '',
          },
        ],
        status: 422,
      });
    });

    it('validates the presence of the Resource type', async () => {
      const response = await testSession
        .post('/api/resources')
        .set('Accept', 'application/json')
        .send({
          TeamId: '1a93d46d-89bf-463b-ab23-8f22f5777907',
          name: 'New Resource',
          type: '',
          variants: [{ name: 'English (US)', displayName: 'English', code: 'en-us' }],
        })
        .expect(StatusCodes.UNPROCESSABLE_ENTITY);

      assert.deepStrictEqual(response.body, {
        errors: [
          {
            message: 'Type cannot be blank',
            path: 'type',
            value: '',
          },
        ],
        status: 422,
      });
    });
  });

  describe('GET /:id', () => {
    it('returns a Resource by id', async () => {
      const response = await testSession
        .get('/api/resources/6ebacda9-8d33-4c3e-beb5-18dffb119046')
        .set('Accept', 'application/json')
        .expect(StatusCodes.OK);

      const data = { ...response.body };
      assert.deepStrictEqual(data, {
        id: '6ebacda9-8d33-4c3e-beb5-18dffb119046',
        TeamId: '1a93d46d-89bf-463b-ab23-8f22f5777907',
        name: 'Resource 2',
        type: 'AUDIO',
        variants: [{ name: 'English (US)', displayName: 'English', code: 'en-us' }],
      });
    });
  });
});
