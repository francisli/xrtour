import assert from 'assert';

import helper from '../helper.js';
import models from '../../models/index.js';

describe('models.Membership', () => {
  beforeEach(async () => {
    await helper.loadFixtures(['users', 'invites', 'teams', 'memberships']);
  });

  describe('.isOwner', () => {
    it('returns true if membership has OWNER role', async () => {
      const membership = await models.Membership.findByPk('5a313737-e5ff-48fd-ba6b-b82983a7a7bf');
      assert.deepStrictEqual(membership.isOwner, true);
    });
  });

  describe('.isEditor', () => {
    it('returns true if membership has OWNER or EDITOR role', async () => {
      const membership = await models.Membership.findByPk('5a313737-e5ff-48fd-ba6b-b82983a7a7bf');
      assert.deepStrictEqual(membership.isEditor, true);
    });
  });
});
