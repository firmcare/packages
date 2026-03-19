/**
 * PM2 ecosystem — manages both the Next.js app and the cron process.
 *
 * Deploy commands:
 *   yarn build
 *   pm2 start ecosystem.config.js --env production
 *   pm2 save
 *
 * Or individually:
 *   yarn start          (Next.js web server)
 *   yarn start:cron     (booking reminder cron)
 */
module.exports = {
  apps: [
    {
      name: "firmcare-web",
      script: "node_modules/.bin/next",
      args: "start",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "firmcare-cron",
      script: "node_modules/.bin/tsx",
      args: "cron.ts",
      env_production: {
        NODE_ENV: "production",
      },
      // Restart cron if it crashes, but don't restart too aggressively
      max_restarts: 5,
      restart_delay: 5000,
    },
  ],
};
