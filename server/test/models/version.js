import assert from 'assert';
import crypto from 'crypto';

import helper from '../helper.js';
import models from '../../models/index.js';

describe('models.Team', () => {
  beforeEach(async () => {
    await helper.loadFixtures(['users', 'invites', 'teams', 'memberships', 'tours']);
  });

  it('hashes a password using sha256', () => {
    const version = models.Version.build({ password: 'abcd1234' });
    assert.deepStrictEqual(version.passwordHash, crypto.createHash('sha256').update('abcd1234').digest('hex'));
  });

  it('only allows one live version for both prod and staging', async () => {
    const stagingVersion1 = await models.Version.create({
      TourId: 'ae61f3e7-7de7-40e2-b9a1-c5ad9ff94806',
      isLive: true,
      isStaging: true,
      data: {},
    });
    assert(stagingVersion1);

    assert.rejects(
      models.Version.create({
        TourId: 'ae61f3e7-7de7-40e2-b9a1-c5ad9ff94806',
        isLive: true,
        isStaging: true,
        data: {},
      })
    );

    const prodVersion1 = await models.Version.create({
      TourId: 'ae61f3e7-7de7-40e2-b9a1-c5ad9ff94806',
      isLive: true,
      isStaging: false,
      data: {},
    });
    assert(prodVersion1);

    assert.rejects(
      models.Version.create({
        TourId: 'ae61f3e7-7de7-40e2-b9a1-c5ad9ff94806',
        isLive: true,
        isStaging: false,
        data: {},
      })
    );
  });
});
