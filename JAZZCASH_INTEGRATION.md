# JazzCash Payment Integration Guide

## Step 1 — Merchant Account Registration

1. Go to: https://merchants.jazzcash.com.pk
2. Click "Register as Merchant"
3. Required documents:
   - CNIC (front + back)
   - Business name / sole proprietorship name
   - Mobile number (Jazz SIM preferred)
   - Bank account details (for payouts)
4. Approval time: 3–7 business days
5. After approval you will receive:
   - `MERCHANT_ID`
   - `PASSWORD`
   - `INTEGRITY_SALT`
   - Sandbox credentials for testing

---

## Step 2 — Credentials Needed (share these when received)

```
JAZZCASH_MERCHANT_ID=
JAZZCASH_PASSWORD=
JAZZCASH_INTEGRITY_SALT=
JAZZCASH_ENV=sandbox   # change to "production" when going live
```

Add these to `healthcare-backend/.env`

---

## Step 3 — How Integration Will Work

```
Customer clicks "Pay Now" on Booking Confirmation
        ↓
Backend creates payment hash (HMAC-SHA256)
        ↓
Customer redirected to JazzCash payment page
        ↓
Customer pays via JazzCash wallet / MPIN
        ↓
JazzCash redirects back to our return URL
        ↓
Backend verifies response hash
        ↓
Booking payment status updated to PAID
```

---

## Step 4 — What Needs to Be Built (when credentials arrive)

### Backend
- `POST /payments/jazzcash/initiate` — create payment hash, return redirect URL
- `POST /payments/jazzcash/callback` — verify JazzCash response, update payment status
- Add `paymentMethod = JAZZCASH` to Payment model

### Frontend
- Payment page after booking confirmation
- Success / failure redirect pages

---

## JazzCash API Endpoints

| Environment | Base URL |
|---|---|
| Sandbox | https://sandbox.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/DoMWalletTransaction |
| Production | https://payments.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/DoMWalletTransaction |

---

## Hash Generation (HMAC-SHA256)

```typescript
import crypto from 'crypto';

function generateHash(params: Record<string, string>, integritySalt: string): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => params[k])
    .join('&');
  const str = `${integritySalt}&${sorted}`;
  return crypto.createHmac('sha256', integritySalt).update(str).digest('hex');
}
```

---

## Required Payment Parameters

```typescript
{
  pp_Version: '1.1',
  pp_TxnType: 'MWALLET',
  pp_Language: 'EN',
  pp_MerchantID: process.env.JAZZCASH_MERCHANT_ID,
  pp_Password: process.env.JAZZCASH_PASSWORD,
  pp_TxnRefNo: `T${Date.now()}`,          // unique per transaction
  pp_Amount: '100000',                     // in paisas (1000 PKR = 100000)
  pp_TxnCurrency: 'PKR',
  pp_TxnDateTime: '20250524120000',        // YYYYMMDDHHmmss
  pp_BillReference: bookingId,
  pp_Description: 'HomeHealth Booking Payment',
  pp_TxnExpiryDateTime: '20250524140000', // 2 hours later
  pp_ReturnURL: 'https://yourdomain.com/payment/callback',
  pp_SecureHash: '',                       // generated last
}
```

---

## Notes

- Amount is in **paisas** — multiply PKR by 100 (e.g. Rs. 500 = 50000)
- `pp_TxnRefNo` must be unique per transaction — use `T` + timestamp
- Sandbox MPIN for testing: `111111` (JazzCash test wallet)
- Production goes live only after JazzCash team manual review

---

## Useful Links

- Merchant Portal: https://merchants.jazzcash.com.pk
- API Docs: https://sandbox.jazzcash.com.pk/Sandbox/
- Support: merchant-support@jazzcash.com.pk | 111-124-924
