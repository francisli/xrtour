import express from 'express';
import fs from 'fs';
import { StatusCodes } from 'http-status-codes';
import Mixpanel from 'mixpanel';
import path from 'path';
import UAParser from 'ua-parser-js';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';
import models from '../../models/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

const mixpanel = process.env.MIXPANEL_TOKEN ? Mixpanel.init(process.env.MIXPANEL_TOKEN) : undefined;

// configure serving up built viewer app assets
router.use(express.static(path.join(__dirname, '../../../viewer/dist/client'), { index: false }));

function readIndexFile() {
  const filePath = path.join(__dirname, '../../../viewer/dist/client', 'index.html');
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, { encoding: 'utf8' });
  }
  return '';
}

const HTML = readIndexFile();

router.post('/view', (req, res) => {
  if (!req.session) {
    req.session = {};
  }
  if (!req.session.distinctId) {
    req.session.distinctId = uuid();
  }
  const { distinctId } = req.session;
  if (distinctId) {
    const { ip } = req;
    const { event, properties } = req.body;
    const userAgent = req.get('User-Agent');
    if (userAgent) {
      const results = UAParser(userAgent);
      properties.userAgent = results;
      properties.$browser = results.browser?.name;
      properties.$browser_version = results.browser?.version;
      properties.$device = `${results.device?.vendor ?? ''} ${results.device?.model ?? ''} ${results.device?.type ?? ''}`.trim();
      properties.$os = `${results.os?.name ?? ''} ${results.os?.version ?? ''}`.trim();
    }
    if (!properties.$referrer) {
      properties.$referrer = req.get('Referrer');
    }
    mixpanel?.track(event, {
      ...properties,
      distinct_id: distinctId,
      ip,
    });
  }
  res.status(StatusCodes.NO_CONTENT).end();
});

router.get('/tours/:tour', async (req, res) => {
  let { tour } = req.params;
  let [team] = req.subdomains;
  const isStaging = team?.toLowerCase() === 'staging';
  if (isStaging) {
    [, team] = req.subdomains;
  }
  if (team && tour) {
    team = await models.Team.findOne({ where: { link: team } });
    if (team) {
      if (tour.startsWith('/')) {
        tour = tour.substring(1);
      }
      tour = await models.Tour.findOne({
        where: {
          TeamId: team.id,
          link: tour.split('/')[0],
        },
      });
      if (tour) {
        const version = await models.Version.findOne({
          where: {
            TourId: tour.id,
            isStaging,
            isLive: true,
          },
        });
        if (version) {
          res.json({
            ...version.data,
            Team: team.toJSON(),
          });
          return;
        }
      }
    }
  }
  res.status(StatusCodes.NOT_FOUND).end();
});

router.get('/*', async (req, res) => {
  let { path: tour } = req;
  let [team] = req.subdomains;
  const isStaging = team?.toLowerCase() === 'staging';
  if (isStaging) {
    [, team] = req.subdomains;
  }
  if (team && tour) {
    team = await models.Team.findOne({ where: { link: team } });
    if (team) {
      if (tour.startsWith('/')) {
        tour = tour.substring(1);
      }
      tour = await models.Tour.findOne({
        where: {
          TeamId: team.id,
          link: tour.split('/')[0],
        },
      });
      if (tour) {
        const version = await models.Version.findOne({
          where: {
            TourId: tour.id,
            isStaging,
            isLive: true,
          },
        });
        if (version) {
          const data = {
            ...version.data,
            Team: team.toJSON(),
          };
          if (req.accepts('html')) {
            try {
              const { render } = await import('../../../viewer/dist/server/main-server.js');
              const helmetContext = {};
              const staticContext = { context: { env: {}, tour: data } };
              staticContext.context.env.BASE_URL = `${req.protocol}://${req.headers.host}`;
              Object.keys(process.env).forEach((key) => {
                if (key.startsWith('VITE_')) {
                  staticContext.context.env[key.substring(5)] = process.env[key];
                }
              });
              const app = render(req, res, helmetContext, staticContext);
              if (app) {
                const { helmet } = helmetContext;
                res.send(
                  HTML.replace(/<title\b[^>]*>(.*?)<\/title>/i, helmet.title.toString())
                    .replace('<link rel="icon" href="" data-rh="true" />', helmet.link.toString())
                    .replace('<meta property="og:image" content="" data-rh="true" />', helmet.meta.toString())
                    .replace('window.STATIC_CONTEXT = {}', `window.STATIC_CONTEXT=${JSON.stringify(staticContext.context)}`)
                    .replace('<div id="root"></div>', `<div id="root">${app}</div>`)
                );
              }
            } catch (error) {
              console.error(error);
              res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
            }
          } else {
            res.json(data);
          }
          return;
        }
      }
    }
  }
  res.status(StatusCodes.NOT_FOUND).end();
});

export default router;
