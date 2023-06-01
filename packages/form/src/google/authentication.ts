import { browser } from '@twitter-voting-bot/browser';
import { logger } from '@twitter-voting-bot/utils';

import { server, fileSystem } from '../std';

type GoogleCredentialsFileType = {
  installed: {
    client_id: string;
    project_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_secret: string;
    redirect_uris: string[];
  };
};

const authenticationLogging = logger('form');
// Inspired by this: https://github.com/googleapis/nodejs-local-auth/blob/main/src/index.ts
// but a lot simpler.
// You should read this to understand the flow: https://developers.google.com/identity/protocols/oauth2/native-app#step-2:-send-a-request-to-googles-oauth-2.0-server
// Ignore the challenge part, we don't need that.
export default async function authenticate(credentialsFilePath: string) {
  const authenticateLogger = authenticationLogging.child('authenticate');

  async function getCredentials() {
    const data = await fileSystem.read(credentialsFilePath);
    return JSON.parse(data.text) as GoogleCredentialsFileType;
  }

  authenticateLogger.debug(
    `Getting the credentials from '${credentialsFilePath}'`
  );
  const credentials = await getCredentials();
  const url = new URL(credentials.installed.auth_uri);
  url.searchParams.append('client_id', credentials.installed.client_id);
  url.searchParams.append(
    'redirect_uri',
    credentials.installed.redirect_uris[0]
  );
  url.searchParams.append('response_type', 'code');
  url.searchParams.append(
    'scope',
    'https://www.googleapis.com/auth/forms.body.readonly'
  );

  authenticateLogger.debug(
    `Got the credentials, starting the auth server and making start the login flow.`
  );
  let closeServer: (() => void) | undefined = undefined;
  closeServer = await server.start(async (request, response) => {
    const url = new URL(request.url!, 'http://localhost:3000');

    if (url.searchParams.has('code')) {
      const code = url.searchParams.get('code') as string;
      authenticateLogger.debug(
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
          redirect_uri: credentials.installed.redirect_uris[0],
          grant_type: 'authorization_code',
        }).toString(),
      });

      authenticateLogger.debug(
        `Got the token, closing the server and the browser and finishing the login flow.`
      );
      console.log(await tokenResponse.json());
      response.end();
      if (closeServer) closeServer();
    } else {
      response.end();
    }
  });
  await browser().googleAuth(url.toString());
}
