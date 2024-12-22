import express from 'express';
import assetsRoutes from './assets.js';
import authRoutes from './auth.js';
import filesRoutes from './files.js';
import invitesRoutes from './invites.js';
import membershipsRoutes from './memberships.js';
import passwordsRoutes from './passwords.js';
import resourcesRoutes from './resources.js';
import stopsRoutes from './stops.js';
import teamsRoutes from './teams.js';
import toursRoutes from './tours.js';
import usersRoutes from './users.js';
import versionsRoutes from './versions.js';

const router = express.Router();

router.use('/assets', assetsRoutes);
router.use('/auth', authRoutes);
router.use('/files', filesRoutes);
router.use('/invites', invitesRoutes);
router.use('/memberships', membershipsRoutes);
router.use('/passwords', passwordsRoutes);
router.use('/resources', resourcesRoutes);
router.use('/stops', stopsRoutes);
router.use('/teams', teamsRoutes);
router.use('/tours', toursRoutes);
router.use('/users', usersRoutes);
router.use('/versions', versionsRoutes);

export default router;
