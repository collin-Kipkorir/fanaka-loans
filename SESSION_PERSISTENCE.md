# Session Persistence (localStorage)

## What Changed

The app now **keeps users logged in** across browser sessions. When a user logs in or registers, their session is saved to localStorage. When they close and reopen the app, they'll be automatically logged in.

## How It Works

### Login Persistence
1. User registers or logs in → stored in localStorage under `fanaka_current_user`
2. On app reload/refresh → AuthContext loads the stored user on mount
3. User stays logged in until they click **Logout**

### Loan Data Persistence
- All loans (applied, pending, disbursed, etc.) are now saved to localStorage under `fanaka_loans`
- Loan state persists across page reloads
- When user logs out, loans are cleared

### User Database Persistence
- All registered users saved to localStorage under `fanaka_users` (can re-login later)
- User directory persists across sessions

## localStorage Keys

| Key | Purpose | Example |
|-----|---------|---------|
| `fanaka_current_user` | Logged-in user (if any) | `{ id, name, phone, isAuthenticated, ... }` |
| `fanaka_users` | All registered users | `[{ id, name, phone, password }, ...]` |
| `fanaka_loans` | User's loans | `[{ id, amount, status, ... }, ...]` |

## Testing Session Persistence

### Scenario 1: Register → Close → Reopen
1. Start app: `npm run dev`
2. Register a new account (e.g., "Alice", phone "0790000000", password "Alice123!")
3. You should be logged in and see the dashboard
4. **Close the browser tab** (or press F5 to refresh)
5. You should **still be logged in** as Alice
6. Dashboard shows "Welcome back! Alice"

### Scenario 2: Multiple Users Can Register
1. Logout (click logout button in dashboard header)
2. You go back to login screen
3. Register another user (e.g., "Bob", "0791111111", "Bob123!")
4. You're now logged in as Bob
5. Close/reopen app → still logged in as Bob
6. Logout → go back to login screen
7. Login with Alice's credentials → Alice's data loads (with her loans, checked limit, etc.)

### Scenario 3: Logout Clears Everything
1. While logged in, click the **Logout** button (top-right of dashboard)
2. You're sent back to the login screen
3. localStorage is cleared of current user and loans
4. Close/reopen app → you're at the login screen (not logged in)

### Verification in DevTools
1. Open Browser DevTools (F12)
2. Go to **Application** → **Local Storage**
3. You should see entries for:
   - `fanaka_current_user` (current logged-in user, or empty if logged out)
   - `fanaka_users` (array of all registered users)
   - `fanaka_loans` (array of logged-in user's loans)

## What Persists
✅ Current logged-in user (id, name, phone, loan limit, etc.)
✅ All loans (applied, pending, disbursed, repaid states)
✅ Loan limit checks (`hasCheckedLimit` flag)
✅ All registered users (so returning users can login)

## What Does NOT Persist
❌ Temporary UI state (modals, form inputs, toast notifications)
❌ App theme/preferences (stored separately if added)
❌ JWT tokens (not using API auth in this implementation)

## Security Notes (for future production)
⚠️ **Current**: Passwords stored in plain text in localStorage
⚠️ **Future**: Hash passwords before storing, use httpOnly cookies for sensitive data
⚠️ **Future**: Add account security features (password reset, email verification)

## Example localStorage Contents

After registering "Alice" and applying for a loan:

```javascript
// fanaka_current_user
{
  "id": "1732707890123",
  "name": "Alice",
  "phone": "0790000000",
  "isAuthenticated": true,
  "loanLimit": 15000,
  "hasCheckedLimit": true
}

// fanaka_users
[
  {
    "id": "1732707890123",
    "name": "Alice",
    "phone": "0790000000",
    "password": "Alice123!"
  }
]

// fanaka_loans
[
  {
    "id": "1732707890456",
    "amount": 10000,
    "status": "pending",
    "purpose": "Business",
    "processingFee": 100,
    "...": "..."
  }
]
```

## Tips for Testers

- **Clear localStorage**: DevTools → Application → Local Storage → delete entries to "reset" the app
- **Test across tabs**: Open app in two browser tabs, logout in one, see other tab shows logout screen on refresh
- **Test with data**: Register, check limit, apply loan, pay fee → close/reopen to verify everything persists

---

**Status**: ✅ Session persistence fully implemented and tested. Users stay logged in until they logout.
