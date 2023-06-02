export class RefreshTokenError extends Error {
  constructor(refreshToken: string) {
    super(`The refresh token '${refreshToken}' is invalid.`);
  }
}
