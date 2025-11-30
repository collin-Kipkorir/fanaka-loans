# Per-User Loan Persistence

## Problem Solved

**Before**: When a user applied for a loan, logged out, and logged back in — the loan history was lost because loans were stored globally in localStorage.

**Now**: Each user's loans are stored separately. When they login, their loans automatically load from localStorage.

## How It Works

### Storage Structure

Instead of one global `fanaka_loans` key, each user has their own loan storage:

```
localStorage keys:
- fanaka_users → all registered users
- fanaka_current_user → who's logged in right now
- fanaka_loans_USER_ID_1 → loans for user 1
- fanaka_loans_USER_ID_2 → loans for user 2
- fanaka_loans_USER_ID_3 → loans for user 3
- etc.
```

Example:
- User "Alice" (id: 1732707890123) has loans stored in `fanaka_loans_1732707890123`
- User "Bob" (id: 1732708000000) has loans stored in `fanaka_loans_1732708000000`
- Each user only sees their own loans

### Loan Lifecycle

1. **Register/Login**: User logs in → app loads their loans from `fanaka_loans_USER_ID`
2. **Apply for Loan**: New loan created → saved to user's loan storage
3. **Pay Fee/Repay**: Loan status changes → immediately persisted to user's storage
4. **Logout**: User logs out → their loans remain saved for next login
5. **Login Again**: User logs back in → all their loans re-load automatically

## Testing Per-User Loan Persistence

### Scenario: Alice Applies → Logout → Bob Applies → Alice Logs Back In

**Step 1: Register & Apply as Alice**
```
1. Open app: npm run dev
2. Register: name="Alice", phone="0790000000", password="Alice123!"
3. You're logged in as Alice
4. Click "Check Loan Limit" (or go to apply)
5. Apply for a loan: amount=10000, period=6, purpose="Business"
6. You see loan in dashboard
7. Open DevTools (F12) → Application → Local Storage
8. Verify: fanaka_loans_<alice_id> contains the loan
```

**Step 2: Logout & Register as Bob**
```
1. Click Logout button
2. Register: name="Bob", phone="0791111111", password="Bob123!"
3. You're logged in as Bob
4. Apply for a loan: amount=5000, period=3, purpose="Education"
5. You see Bob's loan in dashboard
6. DevTools → Local Storage
7. Verify: fanaka_loans_<bob_id> contains Bob's loan (different from Alice's)
```

**Step 3: Alice Logs Back In**
```
1. Click Logout
2. Login: phone="0790000000", password="Alice123!"
3. You're logged in as Alice again
4. **You should see Alice's original loan** (the 10000 amount for Business)
5. Dashboard shows "Current Loan Status" with Alice's loan info
6. Loan History shows her application
```

**Step 4: Verify Separation**
```
1. While logged in as Alice, open DevTools → Local Storage
2. Check: fanaka_loans_<alice_id> has 1 loan (10000)
3. Check: fanaka_loans_<bob_id> exists and has 1 loan (5000)
4. Logout and login as Bob
5. Bob's dashboard shows his 5000 loan, not Alice's
```

## Features That Now Persist Per-User

✅ **Loan Applications** — All applied loans stay with the user
✅ **Loan Status** — pending, in_processing, awaiting_disbursement, disbursed, repaid
✅ **Processing Fees** — Fee amount tied to each loan
✅ **Loan Repayments** — Balance updates after payments
✅ **Loan History** — Full history of user's loans visible on re-login
✅ **Loan Limit Checks** — hasCheckedLimit flag per user
✅ **Loan Limits** — Each user's approved limit amount

## localStorage Keys Reference

| Key | Scope | Content |
|-----|-------|---------|
| `fanaka_users` | Global | `[{ id, name, phone, password }, ...]` |
| `fanaka_current_user` | Global | `{ id, name, phone, isAuthenticated, loanLimit, ... }` |
| `fanaka_loans_<USER_ID>` | Per User | `[{ id, amount, status, purpose, ... }, ...]` |

## Example localStorage After Multi-User Scenario

```javascript
// Global data
fanaka_users: [
  { id: "1732707890123", name: "Alice", phone: "0790000000", password: "Alice123!" },
  { id: "1732708000000", name: "Bob", phone: "0791111111", password: "Bob123!" }
]

fanaka_current_user: 
  { id: "1732707890123", name: "Alice", phone: "0790000000", isAuthenticated: true, loanLimit: 18000 }

// Per-user loans
fanaka_loans_1732707890123: [
  {
    id: "1732707900000",
    amount: 10000,
    status: "pending",
    purpose: "Business",
    processingFee: 100,
    appliedDate: "2025-11-27",
    ...
  }
]

fanaka_loans_1732708000000: [
  {
    id: "1732708100000",
    amount: 5000,
    status: "pending",
    purpose: "Education",
    processingFee: 50,
    appliedDate: "2025-11-27",
    ...
  }
]
```

## Security & Limitations (localStorage)

⚠️ **Not Encrypted**: Anyone with access to browser DevTools can see all data
⚠️ **Not Synced**: Data specific to this browser/device (not cloud sync)
⚠️ **Passwords Plain Text**: For demo only; production needs hashing
⚠️ **No Backup**: If browser cache is cleared, data is lost

## Migration to Backend (When Ready)

To move to a real database:

1. Add a `user_id` field to loans table in DB
2. When storing loans, include the user ID
3. When querying loans, filter by user ID
4. Update AuthContext to call backend endpoints (already scaffolded in `/server`)

---

**Status**: ✅ Per-user loan persistence fully implemented. Each user's loans load automatically on login and persist until logout.
