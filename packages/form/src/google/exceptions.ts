export class RefreshTokenError extends Error {
  constructor(refreshToken: string) {
    super(`The refresh token '${refreshToken}' is invalid.`);
  }
}

export class NonDefinedRedirectUriError extends Error {
  constructor(redirectUri: string, redirectUris: string[]) {
    super(
      `The redirect uri '${redirectUri}' is not a valid redirection url, use one of ${redirectUris
        .map((redirectUri) => `'${redirectUri}'`)
        .join(', ')}\n` +
        `Please, either update GOOGLE_REDIRECT_URL on 'config.ts' file or ` +
        `make sure that it exists on 'twitter-voting-forms-bot-credentials.json' file under 'redirect_uris'\n\n` +
        `DON'T CHANGE 'twitter-voting-forms-bot-credentials.json' DIRECTLY, GENERATE A NEW credentials.json FILE FROM GOOGLE API CONSOLE.`
    );
  }
}
