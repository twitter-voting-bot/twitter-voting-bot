import { handleGoogleAuthenticationCallback } from '@twitter-voting-bot/form';

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('received response');
  const url = new URL(req.url!, 'http://localhost:3000');
  await handleGoogleAuthenticationCallback(url);
  res.status(200).end('Hello Fast!');
}
