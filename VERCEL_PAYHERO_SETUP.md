Add the PayHero serverless forwarder to Vercel

Files added:
- /api/payhero/stk.js  -> POST proxy for initiating MPESA STK push
- /api/payhero/status.js -> GET proxy to query payment status

Required Vercel Environment Variables (set in Project Settings -> Environment Variables):
- PAYHERO_BASE_URL  (e.g. https://backend.payhero.co.ke)
- PAYHERO_AUTH_TOKEN (Basic <base64 token>)
- PAYHERO_CHANNEL_ID (e.g. 3838)
- PAYHERO_ACCOUNT_ID (e.g. 3278)
- PAYHERO_CALLBACK_URL (Your public callback URL. Example: https://yourdomain.com/api/payhero/callback)

Notes:
- Keep credentials secret. Do not commit tokens to the repository.
- Frontend should call the same-origin API routes: `/api/payhero/stk` and `/api/payhero/status?reference=...`.
- Adjust request shapes in the frontend to send `amount` and `phone_number` (local format e.g., 07XXXXXXXX) per PayHero docs or the server will normalize international 254.. -> 07.. automatically.

Testing locally:
- The functions run on Vercel. For local development, keep using the local `server/payhero-example.js` forwarder.

Security:
- The serverless functions forward the Authorization header from environment variables and do not expose the token to the client.
