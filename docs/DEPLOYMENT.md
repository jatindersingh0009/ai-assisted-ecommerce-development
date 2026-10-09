# Deployment Guide

## Local development

For the full fresh setup, see [Move to a New Computer](MOVE_TO_NEW_SYSTEM.md). In brief: configure `backend/.env` and `frontend/.env`, run `npm ci` in both packages, initialize MySQL with `cd backend && npm run db:init`, then run the backend and Vite frontend in separate terminals.

Default local endpoints are `http://localhost:3000` for the API and the URL printed by Vite (usually port `5173` or `5174`) for the frontend. The admin prefix defaults to `/ecomm-manager`; set `VITE_ADMIN_PATH` in `frontend/.env` to change it before building.

## Production checklist

- Build the frontend with `cd frontend && npm ci && npm run build`; serve `frontend/dist/` through Nginx or an equivalent static server.
- Run the API from `backend/` using `npm ci` then `npm start`, managed by systemd, PM2, or a container platform.
- Provision MySQL separately with a restricted application account. The current startup initializer attempts database creation, which requires global `CREATE`; avoid granting that to a public-facing runtime user. Prefer a one-time migration/deployment account and least-privilege runtime account.
- Set unique high-entropy `JWT_SECRET` and `PAYMENT_CREDENTIALS_KEY` values in the backend environment. Keep environment files out of Git.
- Preserve `PAYMENT_CREDENTIALS_KEY` for encrypted database settings. Back it up securely; losing it prevents stored gateway/SMTP secrets from being decrypted.
- Configure the real frontend origin in `CORS_ORIGIN`, the deployed frontend base in `FRONTEND_URL`, and `VITE_API_BASE_URL`/`VITE_ADMIN_PATH` at frontend build time.
- Use HTTPS, restrict inbound MySQL traffic, apply database backups, configure SMTP, and set real payment/webhook URLs before enabling live providers.
- Remove or rotate seeded demo credentials and test data before exposing the site publicly.
- Treat database dumps as sensitive personal data; encrypt them and never commit them.

## Example Nginx reverse proxy

```nginx
location /api/ {
  proxy_pass http://localhost:3000/;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

location / {
  root /var/www/claude-commerce/frontend/dist;
  try_files $uri $uri/ /index.html;
}
```

The backend should listen on localhost or a private interface and should not be directly exposed if Nginx is the public entry point. Configure TLS certificates and security headers at the proxy/load balancer.
