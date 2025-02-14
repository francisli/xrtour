import express from 'express';
import { StatusCodes } from 'http-status-codes';
import _ from 'lodash';
import path from 'path';
import { v4 as uuid } from 'uuid';

import interceptors from '../interceptors.js';
import models from '../../models/index.js';
import s3 from '../../lib/s3.js';
import transcribe from '../../lib/transcribe.js';

const router = express.Router();

router.patch('/:id', interceptors.requireLogin, async (req, res) => {
  const record = await models.File.findByPk(req.params.id, { include: { model: models.Resource, include: 'Team' } });
  if (record) {
    const membership = await record.Resource.Team.getMembership(req.user);
    if (!membership) {
      res.status(StatusCodes.UNAUTHORIZED).end();
    } else {
      try {
        await record.update(_.pick(req.body, ['externalURL', 'key', 'originalName', 'duration', 'width', 'height']));
        res.json(record.toJSON());
      } catch (error) {
        if (error.name === 'SequelizeValidationError') {
          res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
            status: StatusCodes.UNPROCESSABLE_ENTITY,
            errors: error.errors.map((e) => _.pick(e, ['path', 'message', 'value'])),
          });
        } else {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
        }
      }
    }
  } else {
    res.status(StatusCodes.NOT_FOUND).end();
  }
});

router.post('/transcribe', interceptors.requireLogin, async (req, res) => {
  const { id, key } = req.query;
  let mediaFileUri;
  if (id) {
    const record = await models.File.findByPk(id, { include: { model: models.Resource, include: 'Team' } });
    if (record) {
      const membership = await record.Resource.Team.getMembership(req.user);
      if (!membership) {
        res.status(StatusCodes.UNAUTHORIZED).end();
        return;
      }
      mediaFileUri = record.getAssetBucketUri('key');
    }
  } else if (key) {
    mediaFileUri = `s3://${path.join(process.env.AWS_S3_BUCKET, 'uploads', key)}`;
  } else {
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).end();
    return;
  }
  if (!mediaFileUri) {
    res.status(StatusCodes.NOT_FOUND).end();
    return;
  }
  // check if source media file is on same bucket as transcriptions, if not, copy
  if (!mediaFileUri.startsWith(`s3://${process.env.AWS_TRANSCRIBE_BUCKET}`)) {
    const mediaFileKey = mediaFileUri.substring(`s3://${process.env.AWS_S3_BUCKET}`.length + 1);
    const mediaFilePath = await s3.getObject(mediaFileKey);
    await transcribe.putObject(mediaFileKey, mediaFilePath);
    mediaFileUri = `s3://${process.env.AWS_TRANSCRIBE_BUCKET}/${mediaFileKey}`;
  }
  // now trigger transcription
  const jobName = uuid();
  const outputKey = `uploads/${jobName}/${jobName}.json`;
  console.log('!!!', jobName, mediaFileUri, outputKey);
  try {
    const response = await transcribe.startTranscriptionJob(jobName, mediaFileUri, outputKey);
    res.json(response);
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
  }
});

export default router;
