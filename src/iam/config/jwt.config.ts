import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  return {
    secret: process.env.jwt_secret,
    audience: process.env.jwt_token_audience,
    issuer: process.env.jwt_token_issuer,
    accessTokenTtl: parseInt(process.env.jwt_access_token_ttl ?? '3600', 10),
    refreshTokenTtl: parseInt(process.env.jwt_refresh_token_ttl ?? '86400', 10),
  };
});
