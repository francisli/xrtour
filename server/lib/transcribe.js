import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';

import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from '@aws-sdk/client-transcribe';

const config = {
  region: process.env.AWS_TRANSCRIBE_REGION,
  credentials: {
    accessKeyId: process.env.AWS_TRANSCRIBE_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_TRANSCRIBE_SECRET_ACCESS_KEY,
  },
};
const client = new TranscribeClient(config);
const s3client = new S3Client({
  ...config,
  forcePathStyle: true,
});

async function startTranscriptionJob(TranscriptionJobName, MediaFileUri, OutputKey) {
  const options = {
    TranscriptionJobName,
    IdentifyLanguage: true,
    Media: {
      MediaFileUri,
    },
    OutputBucketName: process.env.AWS_TRANSCRIBE_BUCKET,
    OutputKey,
    Subtitles: {
      Formats: ['vtt', 'srt'],
      OutputStartIndex: 1,
    },
  };
  return client.send(new StartTranscriptionJobCommand(options));
}

async function getTranscriptionJob(TranscriptionJobName) {
  const options = {
    TranscriptionJobName,
  };
  return client.send(new GetTranscriptionJobCommand(options));
}

function putObject(Key, filePath) {
  console.log(process.env.AWS_TRANSCRIBE_BUCKET, Key, filePath);
  return s3client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_TRANSCRIBE_BUCKET,
      Key,
      Body: fs.createReadStream(filePath),
    })
  );
}

export default {
  startTranscriptionJob,
  getTranscriptionJob,
  putObject,
};
