const express = require('express');
const { StatusCodes } = require('http-status-codes');
const path = require('path');

const models = require('../../models');

const router = express.Router();

// configure serving up built viewer app assets
router.use(express.static(path.join(__dirname, '../../../viewer/build'), { index: false }));

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
        res.send(`found ${team.name} ${tour.names[tour.variants[0].code]}`);
        return;
      }
    }
  }
  res.status(StatusCodes.NOT_FOUND).end();
});

module.exports = router;
