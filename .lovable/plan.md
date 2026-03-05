
Goal: enhance payment flow so you can (1) clear full due correctly, (2) resend WhatsApp if first send fails, and (3) stop confusing tiny credit leftovers.

1) Root-cause fixes for wrong due/credit behavior
- Problem found:
  - `PaymentDialog` subtracts `credit_balance` twice (`currentBalance - customerCredit`), which can understate due.
  - Balance logic is inconsistent across files (`Customers.tsx`, `Capture.tsx`, `useCustomerBalance.ts`).
  - Floating-point math in `usePayments.processPayment` creates tiny credits like `0.000000000000012`.
- Implementation plan:
  - Standardize due formula everywhere as:  
    `due = max(0, total_invoices - total_payments)`  
    (credit is shown separately as informational/unallocated amount, not subtracted again).
  - Update:
    - `src/components/customers/PaymentDialog.tsx`
    - `src/pages/Customers.tsx`
    - `src/pages/Capture.tsx`
    - `src/hooks/useCustomerBalance.ts`
  - Add money normalization (round to 2 decimals + near-zero clamp) in payment processing:
    - `src/hooks/usePayments.ts`  
    so credits/due are stable and not noisy.

2) “Clear all due balance” action in payment section
- In `PaymentDialog`, add a clear helper action:
  - Button: “Use Full Due Amount”
  - Auto-fills payment amount with exact due.
  - Keep user editable after autofill.
- Improve validation:
  - Reject zero/negative payment submissions.
  - Show clear feedback if due already zero.
- Result:
  - One tap to clear customer dues accurately.

3) WhatsApp resend if first send fails
- Payment receipt resend (payment section):
  - In `PaymentDialog` preview step:
    - Do not auto-close immediately after send.
    - Keep dialog open with buttons:
      - “Send via WhatsApp” (first time)
      - “Send Again” (retry)
      - “Done” (close manually)
    - Mark payment as sent once, but still allow retries.
- Invoice batch resend:
  - In `src/components/invoice/BatchSendDialog.tsx`, allow repeated send attempts before moving next (remove strict one-send disable behavior).

4) Data cleanup for already corrupted tiny credits
- One-time backend data correction (data operation, no schema change):
  - Set very small residual credits to zero (for example absolute value < 0.01).
- This immediately fixes customers like Ali Alnahdi showing phantom credit after settlement.

5) QA plan (end-to-end)
- Customer with due (Ali Alnahdi):
  - Open payment dialog → tap “Use Full Due Amount” → save.
  - Expected: due becomes 0.00, no phantom credit.
- Overpayment test:
  - Due 50, pay 60.
  - Expected: due 0.00, credit 10.00.
- Retry WhatsApp:
  - In payment preview, press send, then resend again.
  - Expected: message can be retried without recreating payment.
- Batch invoice retry:
  - In batch send, retry same invoice send before clicking next.

Technical details
- Files to modify:
  - `src/hooks/usePayments.ts` (money rounding/clamping + safer processPayment)
  - `src/components/customers/PaymentDialog.tsx` (full-due action + resend UX)
  - `src/hooks/useCustomerBalance.ts` (consistent due formula)
  - `src/pages/Customers.tsx` (consistent due display)
  - `src/pages/Capture.tsx` (consistent total balance calculation)
  - `src/components/invoice/BatchSendDialog.tsx` (resend retry support)
- Backend:
  - No schema migration needed.
  - One-time data update to normalize tiny credit balances.
