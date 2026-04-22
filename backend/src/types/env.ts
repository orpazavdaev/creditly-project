export type AppEnv = {
  nodeEnv: string;
  port: number;
  corsOrigin: string;
  jwtSecret: string;
  accessTokenExpiresSeconds: number;
  refreshTokenExpiresDays: number;
  refreshCookieName: string;
  cookieSecure: boolean;
};
