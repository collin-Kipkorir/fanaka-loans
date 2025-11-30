# Register Screen - Password Setting Feature

## What's New

I've enhanced the RegisterScreen with a **password setting section** that includes:

### 1. **Password Field with Visibility Toggle**
- Eye icon button to show/hide password as user types
- Placeholder guidance: "Enter a strong password"
- Minimum 8 characters required

### 2. **Real-time Password Strength Indicator**
- Visual strength bar (6 segments) that fills as password gets stronger
- Strength levels: Very Weak → Weak → Fair → Good → Strong → Very Strong
- Criteria checked:
  - Length: 8+ chars (+1), 12+ chars (+1)
  - Lowercase letters (+1)
  - Uppercase letters (+1)
  - Numbers (+1)
  - Special characters (+1)

### 3. **Confirm Password Field**
- Second password input with its own visibility toggle
- Real-time validation:
  - Shows ✓ "Passwords match" (green) when they match
  - Shows ✗ "Passwords do not match" (red) if they differ

### 4. **Enhanced Validation**
- Rejects registration if password < 8 characters
- Rejects if passwords don't match
- Shows user-friendly error messages

## Field Order on Form
1. Full Name
2. Phone Number
3. National ID
4. **Password** (new)
5. **Confirm Password** (new)

## Visual Design
- Lock icons (🔒) for password fields
- Eye/EyeOff icons for visibility toggle
- Color-coded strength indicator (red → orange → yellow → blue → green)
- Inline validation messages with ✓/✗ symbols

## Updated Register Function Call
The `register()` function now receives:
- `name` (string)
- `phone` (string)  
- `password` (string) ← **Changed from `nationalId`**

The national ID field is still in the form for display/future use, but password is what gets saved.

## How to Test

1. Start the dev server:
```powershell
cd "d:\Typescrips Vscode Projects\fanaka-loans\fanaka-loans"
npm run dev
```

2. Navigate to the Register page

3. Try these password scenarios:
   - Type "pass" → Shows "Very Weak" (red, 1 bar)
   - Type "Pass1!" → Shows "Good" or "Strong" (blue/green)
   - Type "MyPass123!@" → Shows "Very Strong" (all green)
   - Toggle the eye icon to verify show/hide works
   - Enter mismatched passwords → See validation error
   - Submit form → Registers with localStorage

## Files Modified
- `src/components/auth/RegisterScreen.tsx` — Added password fields, validation, and strength indicator
