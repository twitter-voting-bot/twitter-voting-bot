import { browser } from '@twitter-voting-bot/browser';

import { server, fileSystem } from '../std';
import logger from '../logging';
import type { GoogleCredentialsFileType, GoogleTokenType } from './types';
import { RefreshTokenError } from './exceptions';

const googleLogger = logger.child('google');
let credentialsFileData: GoogleCredentialsFileType | undefined = undefined;

/**
 * Used for getting the credentials from the credentials file and caching it in memory so we don't need to read it again.
 *
 * @param credentialsFilePath - The path to the credentials file.
 */
async function getCredentials(
  credentialsFilePath: string
): Promise<GoogleCredentialsFileType> {
  if (!credentialsFileData) {
    const data = await fileSystem.read(credentialsFilePath);
    credentialsFileData = JSON.parse(data.text) as GoogleCredentialsFileType;
  }

  return credentialsFileData;
}

async function refreshForNewAccessToken(
  credentials: GoogleCredentialsFileType,
  previousAuthData: GoogleTokenType,
  path: string
) {
  const refreshTokenResponse = await fetch(credentials.installed.token_uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: new URLSearchParams({
      client_id: credentials.installed.client_id,
      client_secret: credentials.installed.client_secret,
      refresh_token: previousAuthData.refresh_token,
      grant_type: 'refresh_token',
    }).toString(),
  });
  if (!refreshTokenResponse.ok)
    throw new RefreshTokenError(previousAuthData.refresh_token);

  const newAuthData = (await refreshTokenResponse.json()) as Omit<
    GoogleTokenType,
    'refresh_token'
  >;
  const authDataToWrite = {
    ...newAuthData,
    refresh_token: previousAuthData.refresh_token,
  };
  await fileSystem.write(path, JSON.stringify(authDataToWrite));
  return authDataToWrite;
}

function getRedirectUri(credentials: GoogleCredentialsFileType) {
  return `${credentials.installed.redirect_uris[0]}/api/forms/callback`;
}

// Inspired by this: https://github.com/googleapis/nodejs-local-auth/blob/main/src/index.ts
// but a lot simpler.
// You should read this to understand the flow: https://developers.google.com/identity/protocols/oauth2/native-app#step-2:-send-a-request-to-googles-oauth-2.0-server
// Ignore the challenge part, we don't need that.
export async function authenticate(
  credentialsFilePath: string,
  authDataFilePath: string
) {
  const authenticateLogger = googleLogger.child('authenticate');

  async function getCredentialsOrRefresh() {
    authenticateLogger.debug(
      `Checking if the auth data file exists so we can use it`
    );
    const [credentials, existsAuthDataFile] = await Promise.all([
      getCredentials(credentialsFilePath),
      fileSystem.exists(authDataFilePath),
    ]);

    const returnCredentials = () => ({
      isRefreshed: false,
      credentials: credentials,
    });

    if (!existsAuthDataFile) {
      authenticateLogger.debug(
        `The auth data file doesn't exist, returning the credentials.`
      );
      return returnCredentials();
    }
    const authData = JSON.parse(
      (await fileSystem.read(authDataFilePath)).text
    ) as GoogleTokenType;

    try {
      authenticateLogger.debug(
        `Trying to refresh the token with the refresh token '${authData.refresh_token}' to get a new access token. Current access token: '${authData.access_token}'`
      );
      const newAuthData = await refreshForNewAccessToken(
        credentials,
        authData,
        authDataFilePath
      );
      authenticateLogger.debug(
        `Successfully refreshed the token. New token: '${newAuthData.access_token}'`
      );
      return {
        isRefreshed: true,
        authData: newAuthData,
      };
    } catch (e) {
      authenticateLogger.debug(
        `Something went wrong while trying to refresh the token. Returning the credentials or throwing an error.`
      );
      if (e instanceof RefreshTokenError) return returnCredentials();
      throw e;
    }
  }

  const { isRefreshed, ...rest } = await getCredentialsOrRefresh();
  if (isRefreshed && 'authData' in rest)
    return {
      isAuthenticated: true,
      authData: rest.authData,
    };

  const credentials = await getCredentials(credentialsFilePath);
  const url = new URL(credentials.installed.auth_uri);
  url.searchParams.append('client_id', credentials.installed.client_id);
  url.searchParams.append('redirect_uri', getRedirectUri(credentials));
  url.searchParams.append('response_type', 'code');
  url.searchParams.append(
    'scope',
    'https://www.googleapis.com/auth/forms.body.readonly'
  );

  authenticateLogger.debug(
    `Got the credentials, starting the auth server and making start the login flow.`
  );
  await browser().googleAuth(url.toString());

  return {
    isAuthenticated: false,
    authData: undefined,
  };
}

export async function getAccessToken(
  credentialsFilePath: string,
  authDataFilePath: string
) {
  const getAccessTokenLogger = googleLogger.child('getAccessToken');
  const credentials = await getCredentials(credentialsFilePath);

  return async (url: URL) => {
    if (url.searchParams.has('code')) {
      const code = url.searchParams.get('code') as string;
      getAccessTokenLogger.debug(
        `Got the code '${code}', now getting the access token and refresh token.`
      );
      const tokenResponse = await fetch(credentials.installed.token_uri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        // reference: https://stackoverflow.com/a/53189376
        body: new URLSearchParams({
          code: code,
          client_id: credentials.installed.client_id,
          client_secret: credentials.installed.client_secret,
          redirect_uri: getRedirectUri(credentials),
          grant_type: 'authorization_code',
        }).toString(),
      });

      const tokenData = (await tokenResponse.json()) as GoogleTokenType;

      getAccessTokenLogger.debug(
        `Got the token '${tokenData.access_token}', saving the auth data on the file system so we can reuse on future requests.`
      );
      await fileSystem.write(authDataFilePath, JSON.stringify(tokenData));

      getAccessTokenLogger.debug(`Auth data saved for future requests.`);
      return tokenData;
    }
  };
}
