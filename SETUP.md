# Fanaka Loans

A React + TypeScript lending app with M-Pesa integration via PayHero.

## Quick Start

### Prerequisites
- Node.js & npm installed
- PayHero account with STK Push credentials

### Setup

1. **Clone and install**
```sh
git clone <YOUR_GIT_URL>
cd fanaka-loans
npm install
```

2. **Configure PayHero credentials**

Create `.env.local` in the project root with your PayHero credentials:

```env
VITE_PAYHERO_BASE_URL=https://backend.payhero.co.ke
VITE_PAYHERO_ACCOUNT_ID=3278
VITE_PAYHERO_CHANNEL_ID=3838
VITE_PAYHERO_AUTH_TOKEN=Basic QWZaV1Z1VlRHOVNTa2RuWk9wdlVtaHdRM002U0RSRWFXd3dRVlZUVDBOMlFrc3NVazg1ZFRFMVVVb3pGWFhISkpG
VITE_PAYHERO_CALLBACK_URL=http://localhost:8080/api/payment-callback
```

3. **Install backend dependencies**
```sh
cd server
npm install
cd ..
```

4. **Run both servers**

**Option A: Automated (PowerShell on Windows)**
```powershell
powershell -ExecutionPolicy Bypass -File dev.ps1
```

**Option B: Automated (Bash on macOS/Linux)**
```bash
bash dev.sh
```

**Option C: Manual (all platforms)**

Terminal 1 - Start the backend server (port 4100):
```bash
cd server
npm start
```

Terminal 2 - Start the frontend dev server (port 8080):
```bash
npm run dev
```

Then open http://localhost:8080 in your browser.

## Technologies

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn-ui
- **Mobile**: Capacitor (Android/iOS)
- **Backend**: Express.js, Node.js
- **Payments**: PayHero M-Pesa STK Push
- **Authentication**: Local context + localStorage (mock)

## Project Structure

```
fanaka-loans/
├── src/
│   ├── components/
│   │   ├── auth/           # Login, Register, OTP screens
│   │   ├── dashboard/      # Main dashboard
│   │   ├── loan/           # Loan application & history
│   │   ├── payment/        # CollateralPayment (STK flow)
│   │   └── ui/             # Reusable UI components
│   ├── services/
│   │   ├── payhero.ts      # PayHero API client
│   │   └── push.ts         # Web Push subscription
│   ├── contexts/
│   │   └── AuthContext.tsx # User & loan state
│   └── pages/
│       └── Index.tsx       # Main router
├── server/
│   ├── payhero-example.js  # PayHero STK backend
│   └── README_PAYHERO.md   # Payment integration docs
├── public/
│   ├── service-worker.js   # PWA service worker
│   └── manifest.webmanifest
└── vite.config.ts          # Dev server + proxy config
```

## Features

- ✅ User authentication (login/register/OTP)
- ✅ Loan application & management
- ✅ M-Pesa STK push payments via PayHero
- ✅ PWA with offline support & install prompt
- ✅ Push notifications for loan reminders
- ✅ Back button handling for mobile (no accidental exit)
- ✅ Responsive design (mobile-first)

## Payment Flow

1. User applies for a loan
2. System calculates 1% processing fee
3. User pays fee via M-Pesa STK push:
   - Enters phone number
   - Backend initiates PayHero STK
   - User approves on phone
   - PayHero calls webhook callback
4. Loan status updates to "in_processing"
5. After 5 seconds (simulated), status → "awaiting_disbursement"
6. Funds disbursed to user's M-Pesa

## Development

### Available Scripts

- `npm run dev` - Start frontend dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend Server

The backend server (port 4100) handles:
- **POST /api/payhero/stk** - Initiate STK push
- **POST /api/payhero/callback** - Receive payment status webhooks

See `server/README_PAYHERO.md` for detailed API docs.

### Environment Variables

**Frontend (.env.local)**
```
VITE_PAYHERO_BASE_URL
VITE_PAYHERO_ACCOUNT_ID
VITE_PAYHERO_CHANNEL_ID
VITE_PAYHERO_AUTH_TOKEN
VITE_PAYHERO_CALLBACK_URL
```

**Backend** (reads from .env.local via process.env)
Same variables as above

## Troubleshooting

**"404 Not Found" when paying**
- Ensure backend server is running on port 4100
- Check that vite.config.ts has proxy configured for `/api`
- Verify `.env.local` has PayHero credentials

**"STK not received on phone"**
- Verify phone number is correct and linked to M-Pesa
- Check PayHero logs for errors
- Ensure callback URL is reachable

**Port already in use**
- Frontend: Change vite.config.ts `port` to a different number
- Backend: Set `PORT` env var to a different port and update vite proxy target

## Deployment

### Frontend

The frontend can be deployed to any static host (Netlify, Vercel, GitHub Pages, etc.):

```bash
npm run build
# Outputs to dist/ folder
```

### Backend

Deploy `server/payhero-example.js` to a Node.js host (Heroku, Railway, Render, AWS Lambda, etc.):

```bash
npm install --production
PORT=3000 npm start
```

Set the following environment variables on the production server:
- `PAYHERO_BASE_URL`
- `PAYHERO_ACCOUNT_ID`
- `PAYHERO_CHANNEL_ID`
- `PAYHERO_AUTH_TOKEN`
- `PAYHERO_CALLBACK_URL` (must be the public URL of your deployed backend)

## License

MIT
