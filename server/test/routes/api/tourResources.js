const assert = require('assert');
const { StatusCodes } = require('http-status-codes');
const session = require('supertest-session');

const helper = require('../../helper');
const app = require('../../../app');
const models = require('../../../models');

describe('/api/tours/:TourId/resources', () => {
  let testSession;

  beforeEach(async () => {
    await helper.loadUploads([
      ['512x512.png', 'cdd8007d-dcaf-4163-b497-92d378679668.png'],
      ['00-04.m4a', 'd2e150be-b277-4f68-96c7-22a477e0022f.m4a'],
    ]);
    await helper.loadFixtures(['users', 'teams', 'memberships', 'tours', 'resources', 'files', 'tourResources']);
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
    it('returns TourResources for a Tour', async () => {
      const response = await testSession
        .get('/api/tours/495b18a8-ae05-4f44-a06d-c1809add0352/resources')
        .set('Accept', 'application/json')
        .expect(StatusCodes.OK);

      assert.deepStrictEqual(response.body, [
        {
          id: 'a26afd2c-b8bc-41d3-ac56-2ac06377993f',
          TourId: '495b18a8-ae05-4f44-a06d-c1809add0352',
          ResourceId: '0cb2ce76-c5ca-454f-9fb1-47051b0f21ab',
          end: '',
          start: '',
          Resource: {
            TeamId: '1a93d46d-89bf-463b-ab23-8f22f5777907',
            id: '0cb2ce76-c5ca-454f-9fb1-47051b0f21ab',
            name: 'Resource 1',
            type: 'IMAGE',
            variants: [
              {
                code: 'en-us',
                displayName: 'English',
                name: 'English (US)',
              },
            ],
            Files: [
              {
                id: 'ed2f158a-e44e-432d-971e-e5da1a2e33b4',
                ResourceId: '0cb2ce76-c5ca-454f-9fb1-47051b0f21ab',
                variant: 'en-us',
                externalURL: null,
                key: 'cdd8007d-dcaf-4163-b497-92d378679668.png',
                keyURL: '/api/assets/files/ed2f158a-e44e-432d-971e-e5da1a2e33b4/key/cdd8007d-dcaf-4163-b497-92d378679668.png',
                URL: '/api/assets/files/ed2f158a-e44e-432d-971e-e5da1a2e33b4/key/cdd8007d-dcaf-4163-b497-92d378679668.png',
              },
            ],
          },
        },
        {
          id: 'c12c53d9-efe7-4682-a36c-034f7a4d8390',
          TourId: '495b18a8-ae05-4f44-a06d-c1809add0352',
          ResourceId: '6ebacda9-8d33-4c3e-beb5-18dffb119046',
          end: '',
          start: '',
          Resource: {
            TeamId: '1a93d46d-89bf-463b-ab23-8f22f5777907',
            id: '6ebacda9-8d33-4c3e-beb5-18dffb119046',
            name: 'Resource 2',
            type: 'AUDIO',
            variants: [
              {
                code: 'en-us',
                displayName: 'English',
                name: 'English (US)',
              },
            ],
            Files: [
              {
                id: '84b62056-05a4-4751-953f-7854ac46bc0f',
                ResourceId: '6ebacda9-8d33-4c3e-beb5-18dffb119046',
                variant: 'en-us',
                externalURL: null,
                key: 'd2e150be-b277-4f68-96c7-22a477e0022f.m4a',
                keyURL: '/api/assets/files/84b62056-05a4-4751-953f-7854ac46bc0f/key/d2e150be-b277-4f68-96c7-22a477e0022f.m4a',
                URL: '/api/assets/files/84b62056-05a4-4751-953f-7854ac46bc0f/key/d2e150be-b277-4f68-96c7-22a477e0022f.m4a',
              },
            ],
          },
        },
      ]);
    });
  });

  describe('POST /', () => {
    it('creates a new TourResource association', async () => {
      const response = await testSession
        .post('/api/tours/ae61f3e7-7de7-40e2-b9a1-c5ad9ff94806/resources')
        .set('Accept', 'application/json')
        .send({
          ResourceId: '0cb2ce76-c5ca-454f-9fb1-47051b0f21ab',
          start: '',
          end: '',
        })
        .expect(StatusCodes.CREATED);

      assert.deepStrictEqual(response.body, {
        id: response.body.id,
        TourId: 'ae61f3e7-7de7-40e2-b9a1-c5ad9ff94806',
        ResourceId: '0cb2ce76-c5ca-454f-9fb1-47051b0f21ab',
        start: '',
        end: '',
        Resource: {
          TeamId: '1a93d46d-89bf-463b-ab23-8f22f5777907',
          id: '0cb2ce76-c5ca-454f-9fb1-47051b0f21ab',
          name: 'Resource 1',
          type: 'IMAGE',
          variants: [
            {
              code: 'en-us',
              displayName: 'English',
              name: 'English (US)',
            },
          ],
        },
      });
    });
  });

  describe('PATCH /:id', () => {
    it('updates a TourResource association', async () => {
      const response = await testSession
        .patch('/api/tours/495b18a8-ae05-4f44-a06d-c1809add0352/resources/a26afd2c-b8bc-41d3-ac56-2ac06377993f')
        .set('Accept', 'application/json')
        .send({
          start: '00:00',
          end: '00:30',
        })
        .expect(StatusCodes.OK);

      assert.deepStrictEqual(response.body, {
        id: 'a26afd2c-b8bc-41d3-ac56-2ac06377993f',
        TourId: '495b18a8-ae05-4f44-a06d-c1809add0352',
        ResourceId: '0cb2ce76-c5ca-454f-9fb1-47051b0f21ab',
        start: '00:00',
        end: '00:30',
      });
    });
  });

  describe('DELETE /:id', () => {
    it('removes a TourResource association', async () => {
      await testSession
        .delete('/api/tours/495b18a8-ae05-4f44-a06d-c1809add0352/resources/a26afd2c-b8bc-41d3-ac56-2ac06377993f')
        .set('Accept', 'application/json')
        .expect(StatusCodes.NO_CONTENT);

      assert.deepStrictEqual(await models.TourResource.findByPk('a26afd2c-b8bc-41d3-ac56-2ac06377993f'), null);
    });
  });
});