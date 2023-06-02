import { startGoogleAuthenticationFlow } from '@twitter-voting-bot/form';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await startGoogleAuthenticationFlow();
  return res.status(200).end();
}
