# PayHero STK Push Integration

This server integrates with **PayHero** to send M-Pesa STK push prompts for payments.

## Configuration

Set the following environment variables in `.env.local` (or `.env`):

```
PAYHERO_BASE_URL=https://backend.payhero.co.ke
PAYHERO_ACCOUNT_ID=3278
PAYHERO_CHANNEL_ID=3838
PAYHERO_AUTH_TOKEN=Basic QWZaV1Z1VlRHOVNTa2RuWk9wdlVtaHdRM002U0RSRWFXd3dRVlZUVDBOMlFrc3NVazg1ZFRFMVVVb3pGWFhISkpG
PAYHERO_CALLBACK_URL=http://localhost:8080/api/payment-callback
```

## Running the Server

### 1. Install dependencies

```bash
npm install express body-parser node-fetch
```

### 2. Start the server

```bash
node payhero-example.js
```

The server will listen on port 4100 (configurable via `PORT` env var).

## API Endpoints

### POST /api/payhero/stk

Initiate an M-Pesa STK push.

**Request:**
```json
{
  "phone": "254712345678",
  "amount": 100,
  "accountRef": "loan_12345"
}
```

**Response (success):**
```json
{
  "success": true,
  "message": "STK prompt sent successfully",
  "transactionId": "txn_xyz",
  "requestId": "req_xyz"
}
```

**Response (error):**
```json
{
  "success": false,
  "error": "Invalid phone number"
}
```

### POST /api/payhero/callback

Webhook endpoint that receives payment status updates from PayHero.

PayHero will POST the following when payment status changes:

```json
{
  "request_id": "req_xyz",
  "status": "COMPLETED",
  "amount": 100,
  "phone": "254712345678",
  "message": "Payment successful"
}
```

## Production Checklist

- [ ] Verify PayHero credentials in production environment variables
- [ ] Implement webhook signature validation (PayHero will provide a method)
- [ ] Store transaction IDs in database for reconciliation
- [ ] Update loan status to "paid" when callback confirms success
- [ ] Send push notifications to client when payment completes (WebSocket or polling)
- [ ] Handle failed payments gracefully (retry logic, user notification)
- [ ] Implement idempotency for duplicate callback requests
- [ ] Add logging and monitoring for payment flow
- [ ] Test with actual M-Pesa account before going live

## Phone Number Format

The server accepts phone numbers in multiple formats and normalizes to `254XXXXXXXXX`:
- `0712345678` → `254712345678`
- `712345678` → `254712345678`
- `254712345678` → `254712345678`

## Troubleshooting

**"Invalid phone number"**
- Ensure phone starts with country code or leading 0

**"STK not received on phone"**
- Verify the phone number is linked to an active M-Pesa account
- Check that the amount is reasonable (not too high/low)
- Ensure callback URL is reachable for PayHero to notify you

**"API authentication failed"**
- Verify `PAYHERO_AUTH_TOKEN` is correct
- Check that merchant ID and channel ID match your PayHero account
