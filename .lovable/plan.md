

# Continuous Invoice Capture + Multi-Select Send

## Overview
Two features:
1. **Continuous invoicing** -- After completing an invoice for a customer, loop back to the capture step (same customer) instead of resetting to customer selection.
2. **Multi-select invoices** -- On the History page, select multiple invoices and send them one-by-one via WhatsApp using the existing message template.

---

## Feature 1: Continuous Invoice Under Same Customer

### Changes to `src/pages/Capture.tsx`
- In the "done" step, add a third button: **"Add Another Invoice (Same Customer)"** that resets the capture/form state but keeps `selectedCustomer` intact, going back to the `capture` step.
- Rename the existing "New Invoice" button to "New Customer Invoice" for clarity.

---

## Feature 2: Multi-Select & Send Invoices from History

### Changes to `src/pages/History.tsx`
- Add a **selection mode toggle** button (e.g., "Select" / "Cancel") in the header area.
- When in selection mode:
  - Each invoice card gets a checkbox.
  - A sticky bottom bar appears showing: count of selected invoices and a **"Send via WhatsApp"** button.
- Clicking "Send via WhatsApp" opens invoices sequentially:
  - A new dialog/sheet shows the WhatsApp message preview for the first selected invoice.
  - After the user taps "Send" (opens WhatsApp link), the dialog moves to the next selected invoice.
  - Each sent invoice gets its status updated to `sent` in the database.
  - A progress indicator shows "Sending 1 of 3" etc.

### New component: `src/components/invoice/BatchSendDialog.tsx`
- Receives an array of selected invoices (with customer data).
- Steps through each invoice one-by-one.
- For each invoice, generates the WhatsApp message using `generateWhatsAppMessage` from `src/lib/whatsappMessage.ts`.
- Shows language toggle (English/Arabic), message preview, and Send/Copy buttons (reusing the pattern from `MessagePreview.tsx`).
- "Next" button to advance to the next invoice after sending.
- Updates invoice status to `sent` after each send.
- Uses `useInvoices` hook for the `updateInvoice` mutation and `usePayments` for balance calculation.

### Changes to `src/hooks/useInvoices.ts`
- No changes needed; the existing `updateInvoice` mutation handles status updates.

---

## Technical Details

### Files to create:
- `src/components/invoice/BatchSendDialog.tsx` -- Dialog that iterates through selected invoices for WhatsApp sending.

### Files to modify:
- `src/pages/Capture.tsx` -- Add "Add Another Invoice" button in the done step.
- `src/pages/History.tsx` -- Add selection mode with checkboxes, selection bar, and batch send trigger.

### Key implementation notes:
- The batch dialog calculates each invoice's total balance by summing all invoices for that customer minus total payments (using existing hooks).
- WhatsApp messages open via `window.open()` one at a time; the user manually returns to tap "Next" for the next invoice.
- Selection state is an array of invoice IDs managed with `useState` in History page.
- The checkbox uses the existing `@radix-ui/react-checkbox` component already installed.
