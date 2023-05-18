import type { VercelRequest, VercelResponse } from '@vercel/node';
import teste from '@twitter-voting-bot/browser';

export default function handler(req: VercelRequest, res: VercelResponse) {
  teste();
  res.status(200).end('Hello Cron!');
}
