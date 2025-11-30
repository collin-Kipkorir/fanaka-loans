# Auth Flow (localStorage)

**Status:** Registration and login now use browser **localStorage** instead of a database. This allows you to test the full auth flow without setting up MySQL.

## How It Works

- **Registration**: User submits name/phone/password → stored in localStorage under `fanaka_users` key as a JSON array.
- **Login**: User submits phone/password → looked up in the stored users array. If match found, user is logged in.
- **Logout**: Clears the user from memory.

## Data Storage (Browser)

Users are stored in the browser's localStorage as JSON:
```javascript
localStorage.getItem('fanaka_users')
// returns: [{ id: "123", name: "Alice", phone: "0790000000", password: "hashed_or_plain" }, ...]
```

Loans will similarly be stored in localStorage under `fanaka_loans`.

## Testing Registration & Login

### Step 1: Start the frontend dev server
```powershell
cd "d:\Typescrips Vscode Projects\fanaka-loans\fanaka-loans"
npm install  # (if needed)
npm run dev
```

### Step 2: Open the app in browser
- Navigate to `http://localhost:5173` (Vite default)
- You should see the login/register screen

### Step 3: Test Registration
1. Click "Register" or navigate to the register screen
2. Fill in:
   - Name: "Test User"
   - Phone: "0790000000"
   - Password: "Password123"
3. Click Register
4. If successful, you should be logged in and see the dashboard

### Step 4: Verify in Browser DevTools
1. Open Browser DevTools (F12)
2. Go to **Application** → **Local Storage**
3. Look for the entry with key `fanaka_users` and verify your registration is stored:
   ```json
   [
     { "id": "1234567890", "name": "Test User", "phone": "0790000000", "password": "Password123" }
   ]
   ```

### Step 5: Test Login
1. Logout (click the logout button in dashboard header)
2. Go back to login screen
3. Enter:
   - Phone: "0790000000"
   - Password: "Password123"
4. Click Login
5. You should be logged in again

## Limitations (localStorage)
- Data is **cleared if user clears browser cache/storage**
- Data is **not synced** across browser tabs (each tab has its own storage)
- Data is **NOT secure** for production (passwords stored in plain text in browser)
- No persistence across devices

## Next Steps (When Ready for Production)

To move to a real backend:

1. **Option A: Express + MySQL** (see `/server` directory)
   - Uncomment/rebuild the server setup to use a real DB
   - Update AuthContext to call `/api/auth/register` and `/api/auth/login` endpoints

2. **Option B: Supabase / Firebase**
   - Use their SDKs for auth
   - Replace the localStorage calls with their API calls

3. **Security Improvements**
   - Hash passwords before storing (use bcrypt in frontend lib)
   - Use httpOnly cookies instead of localStorage for tokens
   - Add proper error handling and validation

## Related Files
- `src/contexts/AuthContext.tsx` — Auth logic (register, login, logout)
- `src/components/auth/RegisterScreen.tsx` — Registration UI
- `src/components/auth/LoginScreen.tsx` — Login UI
- `src/components/dashboard/Dashboard.tsx` — Dashboard (shows logged-in user's name)
