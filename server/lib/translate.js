import { TranslateClient, TranslateTextCommand } from '@aws-sdk/client-translate'; // ES Modules import

const client = new TranslateClient({
  region: process.env.AWS_TRANSLATE_REGION,
  credentials: {
    accessKeyId: process.env.AWS_TRANSLATE_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_TRANSLATE_SECRET_ACCESS_KEY,
  },
});

export async function translate(Text, SourceLanguageCode, TargetLanguageCode) {
  const options = {
    Text,
    SourceLanguageCode,
    TargetLanguageCode,
  };
  const response = await client.send(new TranslateTextCommand(options));
  const { TranslatedText } = response;
  return TranslatedText;
}

export default {
  translate,
};
