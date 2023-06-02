import { authenticate, getAccessTokenFromCallback } from './google';
import { FILE_PATH, AUTH_DATA_FILE_PATH } from './config';
import { formResponse } from './forms';

export async function startGoogleAuthenticationFlow() {
  const { isAuthenticated, authData } = await authenticate(
    FILE_PATH,
    AUTH_DATA_FILE_PATH
  );
  if (isAuthenticated && authData) {
    await formResponse(authData?.access_token);
  }
}

export async function handleGoogleAuthenticationCallback(url: URL) {
  const handler = await getAccessTokenFromCallback(
    FILE_PATH,
    AUTH_DATA_FILE_PATH
  );
  await handler(url);
}
