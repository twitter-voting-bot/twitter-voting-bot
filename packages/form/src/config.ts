import { fileSystem } from './std';

export const GOOGLE_AUTH_SCOPES = [
  'https://www.googleapis.com/auth/forms.body.readonly',
];

export const FILE_PATH = fileSystem.resolvePath(
  __dirname,
  '../assets/twitter-voting-forms-bot-credentials.json'
);

export const AUTH_DATA_FILE_PATH = fileSystem.resolvePath(
  __dirname,
  '../assets/twitter-voting-forms-bot-auth-data.json'
);
