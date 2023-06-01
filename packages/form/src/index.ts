import path from 'path';
import { authenticate } from './google';

const FILE_PATH = path.resolve(
  __dirname,
  '../assets/twitter-voting-forms-bot-credentials.json'
);

async function main() {
  await authenticate(FILE_PATH);
}

main();
