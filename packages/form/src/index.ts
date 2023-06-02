import { authenticate, getAccessToken } from './google';
import { FILE_PATH, AUTH_DATA_FILE_PATH } from './config';

export async function startGoogleAuthenticationFlow() {
  const { isAuthenticated } = await authenticate(
    FILE_PATH,
    AUTH_DATA_FILE_PATH
  );
  console.log(isAuthenticated);
  if (isAuthenticated) return;
}

export async function handleGoogleAuthenticationCallback(url: URL) {
  const handler = await getAccessToken(FILE_PATH, AUTH_DATA_FILE_PATH);
  await handler(url);
}
