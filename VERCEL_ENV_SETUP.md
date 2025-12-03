# Vercel Environment Variables Setup for PayHero

This guide explains how to configure the required environment variables on Vercel so the PayHero serverless functions can authenticate and process STK push requests.

## Required Environment Variables

Set these in Vercel (Project → Settings → Environment Variables, or via CLI):

| Variable Name | Value | Description |
|---|---|---|
| `PAYHERO_AUTH_TOKEN` | `Basic OWZZWVUwTG9SSkdnZ0pvUmhwQ3M6SDREdWwxQTVTT0N2QksxUk85dTE1eUJoazFXWHhJNFZMcm80Sks0MA==` | PayHero API authentication token (Basic auth) |
| `PAYHERO_CHANNEL_ID` | `3838` | PayHero channel ID for M-Pesa payments |
| `PAYHERO_CALLBACK_URL` | `https://fanaka-loans.vercel.app/api/payment-callback` | Webhook endpoint for PayHero to notify of transaction status |
| `PAYHERO_BASE_URL` | `https://backend.payhero.co.ke` | PayHero API base URL (optional; defaults to this) |

## Option 1: Using Vercel CLI (Recommended & Faster)

1. **Login to Vercel** (if not already logged in):
   ```powershell
   vercel login
   ```

2. **Navigate to project directory**:
   ```powershell
   Set-Location -Path 'D:\Typescrips Vscode Projects\fanaka-loans\fanaka-loans'
   ```

3. **Set environment variables** (run each command, or use the script below):
   ```powershell
   vercel env add PAYHERO_AUTH_TOKEN
   # Paste: Basic OWZZWVUwTG9SSkdnZ0pvUmhwQ3M6SDREdWwxQTVTT0N2QksxUk85dTE1eUJoazFXWHhJNFZMcm80Sks0MA==
   # Select: Production
   
   vercel env add PAYHERO_CHANNEL_ID
   # Paste: 3838
   # Select: Production
   
   vercel env add PAYHERO_CALLBACK_URL
   # Paste: https://fanaka-loans.vercel.app/api/payment-callback
   # Select: Production
   
   vercel env add PAYHERO_BASE_URL
   # Paste: https://backend.payhero.co.ke
   # Select: Production
   ```

   **Or use this PowerShell script** (copy the entire block and run):
   ```powershell
   # Navigate to project
   Set-Location -Path 'D:\Typescrips Vscode Projects\fanaka-loans\fanaka-loans'
   
   # Set each env var (note: each command may prompt for confirmation)
   vercel env add PAYHERO_AUTH_TOKEN
   # When prompted for value, paste: Basic OWZZWVUwTG9SSkdnZ0pvUmhwQ3M6SDREdWwxQTVTT0N2QksxUk85dTE1eUJoazFXWHhJNFZMcm80Sks0MA==
   # When prompted for environment, select: Production
   
   vercel env add PAYHERO_CHANNEL_ID
   # When prompted for value, paste: 3838
   # When prompted for environment, select: Production
   
   vercel env add PAYHERO_CALLBACK_URL
   # When prompted for value, paste: https://fanaka-loans.vercel.app/api/payment-callback
   # When prompted for environment, select: Production
   
   vercel env add PAYHERO_BASE_URL
   # When prompted for value, paste: https://backend.payhero.co.ke
   # When prompted for environment, select: Production
   ```

4. **Redeploy** (so the functions use the new env vars):
   ```powershell
   vercel deploy --prod
   ```

5. **Verify** (check health endpoint):
   ```powershell
   Invoke-RestMethod -Uri 'https://fanaka-loans.vercel.app/api/payhero/health' -Method GET | ConvertTo-Json
   ```
   Expected output (all `true`):
   ```json
   {
       "ok": true,
       "env": {
           "PAYHERO_BASE_URL": true,
           "PAYHERO_AUTH_TOKEN": true,
           "PAYHERO_CHANNEL_ID": true,
           "PAYHERO_CALLBACK_URL": true
       }
   }
   ```

## Option 2: Using Vercel Dashboard (Web UI)

1. **Open Vercel Dashboard**
   - https://vercel.com → select `fanaka-loans` project

2. **Go to Settings → Environment Variables**
   - Click: Settings (top nav) → Environment Variables (left sidebar)

3. **Add each variable** (one at a time):
   - Click "Add New" button
   - Paste the **Name** (e.g., `PAYHERO_AUTH_TOKEN`)
   - Paste the **Value** (the token/URL from the table above)
   - Select **Production** from the Environments dropdown (important!)
   - Click "Save" or "Add"

4. **Repeat for all 4 variables**

5. **Redeploy**
   - Go to Deployments → click latest deployment → "..." menu → "Redeploy"
   - Or push a commit to auto-trigger redeploy

6. **Wait 2-3 minutes for the redeploy to complete**, then test the health endpoint.

## Troubleshooting

### Health endpoint still shows `false` after env vars are set?
- Verify the env vars are set to **Production** scope (not just Preview).
- Wait a few minutes after redeploy for the new env vars to be available.
- Check the Vercel Function logs for any errors:
  ```powershell
  vercel logs fanaka-loans --since 10m --limit 100 | Select-String -Pattern 'payhero' -Context 2,4
  ```

### 401 Unauthorized from PayHero?
- Confirm `PAYHERO_AUTH_TOKEN` is set correctly (exact value from `.env.local`).
- Verify it's scoped to **Production**.
- Check the function logs to see the actual token being used (it should be masked for security, but the function logs will show if it's empty or wrong).

### Still getting errors?
- Share the health endpoint JSON and the function logs (run the command above).
- I'll help debug the exact issue.

## Testing the Payment Flow

Once all env vars show `true` in the health endpoint:

1. **Open the deployed site** (https://fanaka-loans.vercel.app)
2. **Trigger an STK push** from the Collateral Payment page
3. **Check Network tab** (DevTools → Network):
   - POST to `https://fanaka-loans.vercel.app/api/payhero/stk`
   - Response should be 200 (success) or a PayHero error (4xx/5xx), NOT 401
4. **Check Vercel function logs** if there are any errors:
   ```powershell
   vercel logs fanaka-loans --since 5m --limit 100
   ```

## Security Notes

- **Never commit `.env.local` or secrets to Git** — `.gitignore` already excludes `*.local` files.
- **Vercel env vars are secret** — don't expose them in logs or share them publicly.
- **Use non-VITE_ names for server secrets** — `PAYHERO_AUTH_TOKEN` (not `VITE_PAYHERO_AUTH_TOKEN`) so it's not exposed to the client.
