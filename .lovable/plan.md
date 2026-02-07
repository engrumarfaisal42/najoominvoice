

# Add Data Backup/Export Feature

## What This Does
Adds a "Backup Data" button on the Dashboard that exports all your app data (customers, invoices, payments) as a JSON file downloaded to your device. This gives you a local copy of everything for safekeeping.

## Where It Appears
- A new "Backup Data" button on the Dashboard page, below the existing stats section
- Tapping it will instantly download a `.json` file named with the current date (e.g., `najoom-backup-2026-02-07.json`)

## What Gets Backed Up
- All customers (names, phone numbers, credit balances)
- All invoices (numbers, dates, amounts, statuses)
- All payments (amounts, dates, notes)
- Backup timestamp for reference

---

## Technical Details

### New File: `src/hooks/useBackup.ts`
- Fetches all data from `customers`, `invoices`, and `payments` tables
- Packages into a JSON object with a timestamp
- Creates a downloadable file using the browser's Blob API and triggers a download

### Modified File: `src/pages/Dashboard.tsx`
- Import and use the `useBackup` hook
- Add a "Backup Data" button (with a Download icon) in the dashboard, placed after the outstanding balance card
- Show a loading state while the backup is being prepared
- Show a success toast when the backup completes

### Data Format
```json
{
  "backup_date": "2026-02-07T12:00:00Z",
  "customers": [...],
  "invoices": [...],
  "payments": [...]
}
```

No database changes needed. This is purely a frontend feature using existing data.
