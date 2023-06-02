import { browser } from '@twitter-voting-bot/browser';

import { fileSystem } from '../std';
import logger from '../logging';
import type { GoogleCredentialsFileType, GoogleTokenType } from './types';
import { NonDefinedRedirectUriError, RefreshTokenError } from './exceptions';
import {
  GOOGLE_AUTH_SCOPES,
  GOOGLE_REDIRECT_PATH,
  GOOGLE_REDIRECT_URL,
} from '../config';

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
    scopes: GOOGLE_AUTH_SCOPES,
  };
  await fileSystem.write(path, JSON.stringify(authDataToWrite));
  return authDataToWrite;
}

function getRedirectUri(credentials: GoogleCredentialsFileType) {
  if (credentials.installed.redirect_uris.includes(GOOGLE_REDIRECT_URL))
    return `${GOOGLE_REDIRECT_URL}${GOOGLE_REDIRECT_PATH}`;
  else
    throw new NonDefinedRedirectUriError(
      GOOGLE_REDIRECT_URL,
      credentials.installed.redirect_uris
    );
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

    const hasTheSameScopes =
      Array.isArray(authData.scopes) &&
      authData.scopes.join(' ') === GOOGLE_AUTH_SCOPES.join(' ');

    if (!hasTheSameScopes) {
      authenticateLogger.debug(
        `The auth data file doesn't have the same scope as GOOGLE_AUTH_SCOPE, re-authenticating...`
      );
      return returnCredentials();
    }

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
  url.searchParams.append('scope', GOOGLE_AUTH_SCOPES.join(' '));

  authenticateLogger.debug(
    `Got the credentials, starting the auth server and making start the login flow.`
  );
  await browser().googleAuth(url.toString());

  return {
    isAuthenticated: false,
    authData: undefined,
  };
}

/**
 * When the callback is received from the google authentication we continue from here. This will fetch the tokens and save it in a file so we do
 * not need to go through this hole flow again.
 *
 * @param credentialsFilePath - The path of the google credentials file
 * @param authDataFilePath - The path of the auth data, this is the file path we should save the data from the tokens on.
 */
export async function getAccessTokenFromCallback(
  credentialsFilePath: string,
  authDataFilePath: string
): Promise<(url: URL) => Promise<GoogleTokenType | undefined>> {
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
      await fileSystem.write(
        authDataFilePath,
        JSON.stringify({ ...tokenData, scopes: GOOGLE_AUTH_SCOPES })
      );

      getAccessTokenLogger.debug(`Auth data saved for future requests.`);
      return tokenData;
    }
  };
}
