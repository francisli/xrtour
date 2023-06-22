const express = require('express');
const fs = require('fs');
const { StatusCodes } = require('http-status-codes');
const path = require('path');

require('@babel/register')({
  only: [
    function only(filepath) {
      return filepath.startsWith(path.resolve(__dirname, '../../../viewer'));
    },
  ],
  presets: ['@babel/preset-env', ['@babel/preset-react', { runtime: 'automatic' }]],
  plugins: [
    [
      'transform-assets',
      {
        extensions: ['css', 'svg'],
        name: 'static/media/[name].[hash:8].[ext]',
      },
    ],
  ],
});
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { StaticRouter } = require('react-router-dom/server');
const { HelmetProvider } = require('react-helmet-async');

const { defaultValue: defaultStaticContext, StaticContextProvider } = require('../../../viewer/src/StaticContext');
const App = require('../../../viewer/src/App').default;
const { handleRedirects } = require('../../../viewer/src/AppRedirects');

const models = require('../../models');

const router = express.Router();

// configure serving up built viewer app assets
router.use(express.static(path.join(__dirname, '../../../viewer/build'), { index: false }));

function readIndexFile() {
  const filePath = path.join(__dirname, '../../../viewer/build', 'index.html');
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, { encoding: 'utf8' });
  }
  return '';
}
const HTML = readIndexFile();

router.get('/*', async (req, res) => {
  let [team, tour] = req.subdomains;
  const isStaging = tour?.toLowerCase() === 'staging';
  if (isStaging) {
    [, , tour] = req.subdomains;
  }
  if (team && tour) {
    team = await models.Team.findOne({ where: { link: team } });
    if (team) {
      tour = await models.Tour.findOne({
        where: {
          TeamId: team.id,
          link: tour,
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
          if (req.accepts('html')) {
            try {
              const { path: urlPath, url: location } = req;
              const isRedirected = handleRedirects(req, location, urlPath, (to, state) => {
                if (state) {
                  res.redirect(`${to}?${new URLSearchParams({ from: location }).toString()}`);
                } else {
                  res.redirect(to);
                }
                return true;
              });
              if (isRedirected) return;
              const staticContext = { ...defaultStaticContext, tour: version.data };
              const helmetContext = {};
              const reactApp = ReactDOMServer.renderToString(
                React.createElement(
                  StaticContextProvider,
                  { value: staticContext },
                  React.createElement(
                    HelmetProvider,
                    { context: helmetContext },
                    React.createElement(StaticRouter, { location }, React.createElement(App))
                  )
                )
              );
              const { helmet } = helmetContext;
              res.send(
                HTML.replace(/<title\b[^>]*>(.*?)<\/title>/i, helmet.title.toString())
                  .replace('window.STATIC_CONTEXT={}', `window.STATIC_CONTEXT=${JSON.stringify(staticContext)}`)
                  .replace('<div id="root"></div>', `<div id="root">${reactApp}</div>`)
              );
            } catch (error) {
              res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
            }
          } else {
            res.json(version.data);
          }
          return;
        }
      }
    }
  }
  res.status(StatusCodes.NOT_FOUND).end();
});

module.exports = router;
