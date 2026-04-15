
Goal: fix customer ledger logic so credit is automatically consumed by new invoices and the UI never shows misleading “credit + due” at the same time.

What I found
- The current UI mostly uses `due = total invoices - total payments`, which is okay for display.
- The real problem is backend logic in `src/hooks/usePayments.ts`:
  - `processPayment` only marks an invoice as paid if the full invoice amount is covered.
  - If a customer pays part of a large invoice, the leftover payment is incorrectly stored as `credit_balance`.
  - That creates the wrong state: customer still has due, but also shows credit.
- Another missing piece: when a new invoice is created, existing customer credit is not automatically applied to that new invoice, even though you want available credit to be used immediately.

Implementation plan

1) Fix payment allocation logic
- Update `src/hooks/usePayments.ts` so customer credit is based on overall account math, not only fully paid invoices.
- New rule:
  - `netAccount = totalPaymentsIncludingNew + existingCredit - totalInvoices`
  - if `netAccount > 0`, store it as credit
  - otherwise store credit as `0`
- Keep invoice status updates, but do not treat partial payments as customer credit.

2) Auto-use existing credit when a new invoice is created
- Update `src/pages/Capture.tsx` after invoice creation:
  - check customer’s current `credit_balance`
  - if credit fully covers the new invoice, mark invoice as paid and reduce credit
  - if credit partially covers it, reduce credit to zero and keep invoice pending/sent as appropriate
- This matches your expected behavior: available credit gets used whenever a new invoice is added to that customer.

3) Make ledger/customer list display consistent
- Update `src/components/customers/CustomerList.tsx`
- Update `src/pages/Customers.tsx`
- Update `src/hooks/useCustomerBalance.ts`
- Show:
  - Due only when outstanding amount remains after using available credit
  - Credit only when there is true extra money after covering all invoices
- Prevent showing both positive due and positive credit together in normal cases.

4) Update reminder/statement/payment resend calculations
- Review and adjust:
  - `src/components/customers/ReminderDialog.tsx`
  - `src/components/customers/StatementDialog.tsx`
  - `src/components/history/PaymentResendDialog.tsx`
- Ensure all customer balance messages use the same “credit applied first” logic.

5) Edge-case handling
- Clamp money values to 2 decimals everywhere relevant.
- Treat values smaller than `0.01` as zero.
- Preserve WhatsApp resend features already added.

6) QA checks
- Customer has old credit, then new invoice is created:
  - credit should reduce automatically before showing due.
- Partial payment on a large invoice:
  - should reduce due, not create fake credit.
- Overpayment:
  - should show credit only when money truly exceeds all invoices.
- Ali Nahdi case:
  - verify no credit is shown while any real due remains.

Technical details
- Files to modify:
  - `src/hooks/usePayments.ts`
  - `src/pages/Capture.tsx`
  - `src/hooks/useCustomerBalance.ts`
  - `src/pages/Customers.tsx`
  - `src/components/customers/CustomerList.tsx`
  - `src/components/customers/ReminderDialog.tsx`
  - `src/components/customers/StatementDialog.tsx`
  - `src/components/history/PaymentResendDialog.tsx`
- No schema change needed.
- No migration needed.
- If bad credit values already exist from old logic, I may also add a one-time data cleanup step after implementation.
