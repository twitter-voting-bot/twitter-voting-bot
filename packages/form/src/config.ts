import { fileSystem } from './std';

export const GOOGLE_REDIRECT_PATH = '/api/forms/callback';
export const GOOGLE_REDIRECT_URL = 'http://localhost:3000';
export const GOOGLE_AUTH_SCOPES = [
  'https://www.googleapis.com/auth/forms.body.readonly',
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/forms.responses.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

export const FORMS_API_HOST = 'https://forms.googleapis.com';
export const FORMS_ID = '1_HgQ50Guw5LH9FFYHUa9anOHah7h6kqcad2rTy2wiBI';
export const SHEETS_API_HOST = 'https://sheets.googleapis.com/v4/spreadsheets';

export const FILE_PATH = fileSystem.resolvePath(
  __dirname,
  '../assets/twitter-voting-forms-bot-credentials.json'
);

export const AUTH_DATA_FILE_PATH = fileSystem.resolvePath(
  __dirname,
  '../assets/twitter-voting-forms-bot-auth-data.json'
);
