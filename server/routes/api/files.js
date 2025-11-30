import express from 'express';
import { StatusCodes } from 'http-status-codes';
import _ from 'lodash';
import path from 'path';
import { v4 as uuid } from 'uuid';

import interceptors from '../interceptors.js';
import models from '../../models/index.js';
import s3 from '../../lib/s3.js';
import { translateDocument } from '../../lib/translate.js';
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

router.get('/translate', interceptors.requireLogin, async (req, res) => {
  const { id, key, source, target } = req.query;
  console.log('!!', id, key, source, target);
  let vttKey;
  if (id) {
    const record = await models.File.findByPk(id, { include: { model: models.Resource, include: 'Team' } });
    if (record) {
      const membership = await record.Resource.Team.getMembership(req.user);
      if (!membership) {
        res.status(StatusCodes.UNAUTHORIZED).end();
        return;
      }
      vttKey = record.getAssetPath('key');
    }
  } else if (key) {
    vttKey = path.join('uploads', key);
  } else {
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).end();
    return;
  }
  if (!vttKey) {
    res.status(StatusCodes.NOT_FOUND).end();
    return;
  }
  // download file
  const vttFileData = await s3.getObjectData(vttKey);
  const translatedFileData = await translateDocument(vttFileData, source, target);
  const outputKey = `${uuid()}.vtt`;
  const outputPath = `uploads/${outputKey}`;
  await s3.putObjectData(outputPath, translatedFileData);
  res.json({
    key: outputKey,
    previewURL: await s3.getSignedAssetUrl(outputPath),
  });
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
  try {
    const response = await transcribe.startTranscriptionJob(jobName, mediaFileUri, outputKey);
    res.json(response);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
  }
});

router.get('/transcribe', interceptors.requireLogin, async (req, res) => {
  const { jobName } = req.query;
  if (!jobName) {
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).end();
    return;
  }
  try {
    const response = await transcribe.getTranscriptionJob(jobName);
    if (response.TranscriptionJob?.TranscriptionJobStatus == 'COMPLETED') {
      // if transcription bucket is not the same as assets bucket, copy
      const jobName = response.TranscriptionJob?.TranscriptionJobName;
      const vttFileKey = `uploads/${jobName}/${jobName}.vtt`;
      const vttFilePath = await transcribe.getObject(vttFileKey);
      await s3.putObject(vttFileKey, vttFilePath);
      response.TranscriptionJob.Transcript.TranscriptVttFileUri = await s3.getSignedAssetUrl(vttFileKey);
    }
    res.json(response);
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
  }
});

export default router;
