import assert from 'assert';
import { StatusCodes } from 'http-status-codes';
import session from 'supertest-session';
import path from 'path';

import helper from '../../helper.js';
import app from '../../../app.js';
import models from '../../../models/index.js';

describe('/api/tours', () => {
  let testSession;

  beforeEach(async () => {
    await helper.loadUploads([
      ['512x512.png', 'cdd8007d-dcaf-4163-b497-92d378679668.png'],
      ['testing123.m4a', 'd2e150be-b277-4f68-96c7-22a477e0022f.m4a'],
    ]);
    await helper.loadFixtures([
      'users',
      'invites',
      'invites',
      'teams',
      'memberships',
      'resources',
      'files',
      'tours',
      'stops',
      'tourStops',
      'stopResources',
    ]);
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
    it('returns a list of Tours for a specified Team', async () => {
      const response = await testSession
        .get('/api/tours?TeamId=1a93d46d-89bf-463b-ab23-8f22f5777907')
        .set('Accept', 'application/json')
        .expect(StatusCodes.OK);
      assert.deepStrictEqual(response.body.length, 2);
      assert.deepStrictEqual(response.body[0].link, 'tour1');
      assert.deepStrictEqual(response.body[1].link, 'tour2');
    });
  });

  describe('POST /', () => {
    it('creates a new Tour', async () => {
      const data = {
        TeamId: '1a93d46d-89bf-463b-ab23-8f22f5777907',
        name: 'Internal New Tour Name',
        link: 'newtour',
        names: { 'en-us': 'New Tour' },
        descriptions: { 'en-us': 'New Tour description' },
        variants: [{ name: 'English (US)', displayName: 'English', code: 'en-us' }],
        visibility: 'PRIVATE',
      };
      const response = await testSession.post('/api/tours').set('Accept', 'application/json').send(data).expect(StatusCodes.CREATED);

      assert(response.body?.id);
      assert.deepStrictEqual(response.body, {
        ...data,
        id: response.body.id,
        IntroStopId: null,
        CoverResourceId: null,
        createdAt: response.body.createdAt,
        updatedAt: response.body.updatedAt,
        archivedAt: null,
      });

      const record = await models.Tour.findByPk(response.body.id);
      assert(record);
      assert.deepStrictEqual(record.name, 'Internal New Tour Name');
      assert.deepStrictEqual(record.link, 'newtour');
    });

    it('validates the presence of the Tour name', async () => {
      const response = await testSession
        .post('/api/tours')
        .set('Accept', 'application/json')
        .send({
          TeamId: '1a93d46d-89bf-463b-ab23-8f22f5777907',
          link: 'newtour',
          names: {},
          descriptions: { 'en-us': 'New Tour description' },
          variants: [{ name: 'English (US)', displayName: 'English', code: 'en-us' }],
          visibility: 'PRIVATE',
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

    it('validates the uniqueness of the Tour link', async () => {
      const response = await testSession
        .post('/api/tours')
        .set('Accept', 'application/json')
        .send({
          TeamId: '1a93d46d-89bf-463b-ab23-8f22f5777907',
          link: 'tour2',
          names: { 'en-us': 'New Tour' },
          descriptions: { 'en-us': 'New Tour description' },
          variants: [{ name: 'English (US)', displayName: 'English', code: 'en-us' }],
          visibility: 'PRIVATE',
        })
        .expect(StatusCodes.UNPROCESSABLE_ENTITY);

      assert.deepStrictEqual(response.body, {
        errors: [
          {
            message: 'Link already taken',
            path: 'link',
            value: 'tour2',
          },
        ],
        status: 422,
      });
    });

    it('validates the format of the Team link', async () => {
      const response = await testSession
        .post('/api/tours')
        .set('Accept', 'application/json')
        .send({
          TeamId: '1a93d46d-89bf-463b-ab23-8f22f5777907',
          link: 'invalid link',
          names: { 'en-us': 'New Tour' },
          descriptions: { 'en-us': 'New Tour description' },
          variants: [{ name: 'English (US)', displayName: 'English', code: 'en-us' }],
          visibility: 'PRIVATE',
        })
        .expect(StatusCodes.UNPROCESSABLE_ENTITY);

      assert.deepStrictEqual(response.body, {
        errors: [
          {
            message: 'Letters, numbers, and hyphen only',
            path: 'link',
            value: 'invalid link',
          },
        ],
        status: 422,
      });
    });
  });

  describe('GET /:id', () => {
    it('returns a Tour by id', async () => {
      const response = await testSession
        .get('/api/tours/495b18a8-ae05-4f44-a06d-c1809add0352')
        .set('Accept', 'application/json')
        .expect(StatusCodes.OK);

      const data = { ...response.body };
      assert.deepStrictEqual(data, {
        id: '495b18a8-ae05-4f44-a06d-c1809add0352',
        TeamId: '1a93d46d-89bf-463b-ab23-8f22f5777907',
        CoverResourceId: null,
        IntroStopId: null,
        name: 'Tour 2',
        link: 'tour2',
        names: { 'en-us': 'Tour 2' },
        descriptions: { 'en-us': 'Tour 2 description' },
        variants: [{ name: 'English (US)', displayName: 'English', code: 'en-us' }],
        visibility: 'PRIVATE',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        archivedAt: null,
        Team: {
          id: '1a93d46d-89bf-463b-ab23-8f22f5777907',
          link: 'regularuser',
          favicon: null,
          faviconURL: null,
          name: "Regular's Personal Team",
          variants: [
            {
              code: 'en-us',
              displayName: 'English',
              name: 'English (US)',
            },
          ],
          font: null,
          colorPrimary: null,
          colorSecondary: null,
        },
      });
    });
  });

  describe('POST /translate', () => {
    it('translates a Tour name/description', async function () {
      if (process.env.CI) {
        return this.skip();
      }
      const response = await testSession
        .post('/api/tours/translate')
        .set('Accept', 'application/json')
        .send({
          source: 'en-us',
          target: 'es',
          data: {
            name: 'Tour 2',
            description: 'Tour 2 description',
          },
        })
        .expect(StatusCodes.OK);

      assert.deepStrictEqual(response.body, {
        name: 'Vuelta 2',
        description: 'Descripción del Tour 2',
      });
    });
  });

  describe('PATCH /:id', () => {
    it('updates a Tour by id', async () => {
      const data = {
        name: 'Updated Internal Tour Name',
        link: 'updatedtour',
        names: { 'en-us': 'Updated Tour' },
        descriptions: { 'en-us': 'Updated Tour description' },
        variants: [{ name: 'English (US)', displayName: 'English', code: 'en-us' }],
        visibility: 'UNLISTED',
      };
      const response = await testSession
        .patch('/api/tours/495b18a8-ae05-4f44-a06d-c1809add0352')
        .set('Accept', 'application/json')
        .send(data)
        .expect(StatusCodes.OK);

      assert.deepStrictEqual(response.body, {
        ...data,
        id: '495b18a8-ae05-4f44-a06d-c1809add0352',
        CoverResourceId: null,
        IntroStopId: null,
        TeamId: '1a93d46d-89bf-463b-ab23-8f22f5777907',
        Team: response.body.Team,
        createdAt: response.body.createdAt,
        updatedAt: response.body.updatedAt,
        archivedAt: null,
      });

      const record = await models.Tour.findByPk('495b18a8-ae05-4f44-a06d-c1809add0352');
      assert(record);
      assert.deepStrictEqual(record.name, 'Updated Internal Tour Name');
      assert.deepStrictEqual(record.link, 'updatedtour');
      assert.deepStrictEqual(record.names, { 'en-us': 'Updated Tour' });
      assert.deepStrictEqual(record.descriptions, { 'en-us': 'Updated Tour description' });
      assert.deepStrictEqual(record.variants, [{ name: 'English (US)', displayName: 'English', code: 'en-us' }]);
      assert.deepStrictEqual(record.visibility, 'UNLISTED');
    });

    it('updates all Tour Stops and Resources with new variants', async () => {
      const data = {
        variants: [
          { name: 'English (US)', displayName: 'English', code: 'en-us' },
          { name: 'Spanish', displayName: 'Español', code: 'es' },
        ],
      };
      await testSession
        .patch('/api/tours/495b18a8-ae05-4f44-a06d-c1809add0352')
        .set('Accept', 'application/json')
        .send(data)
        .expect(StatusCodes.OK);

      const record = await models.Tour.findByPk('495b18a8-ae05-4f44-a06d-c1809add0352', {
        include: [
          { model: models.Resource, as: 'CoverResource', include: 'Files' },
          {
            model: models.Stop,
            as: 'IntroStop',
            include: {
              model: models.StopResource,
              as: 'Resources',
              include: { model: models.Resource, include: 'Files' },
            },
          },
          {
            model: models.TourStop,
            include: [
              {
                model: models.Stop,
                include: {
                  model: models.StopResource,
                  as: 'Resources',
                  include: { model: models.Resource, include: 'Files' },
                },
              },
              {
                model: models.Stop,
                as: 'TransitionStop',
                include: {
                  model: models.StopResource,
                  as: 'Resources',
                  include: { model: models.Resource, include: 'Files' },
                },
              },
            ],
          },
        ],
      });
      assert.deepStrictEqual(record.variants, data.variants);
      for (const ts of record.TourStops) {
        assert.deepStrictEqual(ts.Stop.variants, data.variants);
        for (const sr of ts.Stop.Resources) {
          assert.deepStrictEqual(sr.Resource.variants, data.variants);
          const Files = [...sr.Resource.Files];
          for (const variant of data.variants) {
            assert.ok(Files.find((file) => file.variant === variant.code));
          }
        }
      }
    });
  });

  describe('DELETE /:id', () => {
    it('archives a Tour and orphaned Stops and Resources', async () => {
      await testSession.delete('/api/tours/495b18a8-ae05-4f44-a06d-c1809add0352').expect(StatusCodes.NO_CONTENT);

      let record = await models.Tour.findByPk('495b18a8-ae05-4f44-a06d-c1809add0352');
      assert.ok(record.archivedAt);

      record = await models.Stop.findByPk('e39b97ad-a5e9-422c-b256-d50fec355285');
      assert.ok(record.archivedAt);

      record = await models.Stop.findByPk('bba84716-633e-4593-85a0-9da4010eb99b');
      assert.ok(record.archivedAt);

      record = await models.Resource.findByPk('0cb2ce76-c5ca-454f-9fb1-47051b0f21ab');
      assert.ok(record.archivedAt);

      record = await models.Resource.findByPk('6ebacda9-8d33-4c3e-beb5-18dffb119046');
      assert.ok(record.archivedAt);
    });

    it('permanently deletes a Tour and orphaned Stops and Resources', async () => {
      // publish first so we can test deletion of version data
      const data = {
        TourId: '495b18a8-ae05-4f44-a06d-c1809add0352',
        isStaging: false,
      };
      const { body: version } = await testSession
        .post('/api/versions')
        .set('Accept', 'application/json')
        .send(data)
        .expect(StatusCodes.CREATED);
      await testSession.delete('/api/tours/495b18a8-ae05-4f44-a06d-c1809add0352?isPermanent=true').expect(StatusCodes.NO_CONTENT);

      let record = await models.Tour.findByPk('495b18a8-ae05-4f44-a06d-c1809add0352');
      assert.deepStrictEqual(record, null);

      record = await models.Version.findByPk(version.id);
      assert.deepStrictEqual(record, null);
      assert.deepStrictEqual(
        await helper.assetPathExists(
          path.join(
            'versions',
            version.id,
            'files',
            'ed2f158a-e44e-432d-971e-e5da1a2e33b4',
            'key',
            'cdd8007d-dcaf-4163-b497-92d378679668.png'
          )
        ),
        false
      );
      assert.deepStrictEqual(
        await helper.assetPathExists(
          path.join(
            'versions',
            version.id,
            'files',
            '84b62056-05a4-4751-953f-7854ac46bc0f',
            'key',
            'd2e150be-b277-4f68-96c7-22a477e0022f.m4a'
          )
        ),
        false
      );

      record = await models.Stop.findByPk('e39b97ad-a5e9-422c-b256-d50fec355285');
      assert.deepStrictEqual(record, null);

      record = await models.Stop.findByPk('bba84716-633e-4593-85a0-9da4010eb99b');
      assert.deepStrictEqual(record, null);

      record = await models.Resource.findByPk('0cb2ce76-c5ca-454f-9fb1-47051b0f21ab');
      assert.deepStrictEqual(record, null);

      record = await models.Resource.findByPk('6ebacda9-8d33-4c3e-beb5-18dffb119046');
      assert.deepStrictEqual(record, null);

      record = await models.File.findByPk('ed2f158a-e44e-432d-971e-e5da1a2e33b4');
      assert.deepStrictEqual(record, null);
      assert.deepStrictEqual(
        await helper.assetPathExists(
          path.join('files', 'ed2f158a-e44e-432d-971e-e5da1a2e33b4', 'key', 'cdd8007d-dcaf-4163-b497-92d378679668.png')
        ),
        false
      );

      record = await models.File.findByPk('84b62056-05a4-4751-953f-7854ac46bc0f');
      assert.deepStrictEqual(record, null);
      assert.deepStrictEqual(
        await helper.assetPathExists(
          path.join('files', '84b62056-05a4-4751-953f-7854ac46bc0f', 'key', 'd2e150be-b277-4f68-96c7-22a477e0022f.m4a')
        ),
        false
      );
    });
  });

  describe('PATCH /:id/restore', () => {
    it('restores an archived a Tour and its Stops and Resources', async () => {
      await testSession.delete('/api/tours/495b18a8-ae05-4f44-a06d-c1809add0352').expect(StatusCodes.NO_CONTENT);
      await testSession.patch('/api/tours/495b18a8-ae05-4f44-a06d-c1809add0352/restore').expect(StatusCodes.NO_CONTENT);

      let record = await models.Tour.findByPk('495b18a8-ae05-4f44-a06d-c1809add0352');
      assert.deepStrictEqual(record.archivedAt, null);

      record = await models.Stop.findByPk('e39b97ad-a5e9-422c-b256-d50fec355285');
      assert.deepStrictEqual(record.archivedAt, null);

      record = await models.Stop.findByPk('bba84716-633e-4593-85a0-9da4010eb99b');
      assert.deepStrictEqual(record.archivedAt, null);

      record = await models.Resource.findByPk('0cb2ce76-c5ca-454f-9fb1-47051b0f21ab');
      assert.deepStrictEqual(record.archivedAt, null);

      record = await models.Resource.findByPk('6ebacda9-8d33-4c3e-beb5-18dffb119046');
      assert.deepStrictEqual(record.archivedAt, null);
    });
  });
});
