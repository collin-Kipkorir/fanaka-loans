# Push Server Example (Fanaka Loans)

This directory contains a small example showing how to accept Web Push subscriptions from the client
and send push notifications using `web-push`.

Important notes:
- This is a demo only. Do NOT use the in-memory subscription store in production.
- Generate VAPID keys and keep the private key secret.

Steps:

1. Install dependencies

   npm install express body-parser web-push

2. Generate VAPID keys (one-time)

   npx web-push generate-vapid-keys --json

   Copy the `publicKey` and `privateKey` values into environment variables:

   - VAPID_PUBLIC
   - VAPID_PRIVATE

3. Run the example server

   VAPID_PUBLIC=... VAPID_PRIVATE=... node push-server-example.js

4. Client usage

 - The client will call `/api/save-subscription` (this example server route) with the subscription JSON.
 - To trigger a push, POST to `/api/send-push` with optional JSON { payload: { title, body, data } }.

Security & Production
 - Persist subscriptions in a DB keyed to user IDs.
 - Rotate and protect your VAPID private key.
 - Use TLS in production and restrict access to push endpoints.
