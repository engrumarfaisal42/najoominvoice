

## Diagnosis (confirmed)

Database content right now:
- customers: **10**
- invoices: **154**
- payments: **16**
- active sessions: 25 (all valid)

Nothing is missing. The empty UI is caused by a client bug, not data loss.

The current `AuthContext` does:
```ts
supabase['rest']['headers']['x-session-token'] = token;
```
This mutates a non-effective internal field. In supabase-js v2 the PostgREST builder uses the headers captured at `createClient()` time, so the `x-session-token` header never goes out on the wire. RLS policy `has_valid_session()` then returns false → API returns `[]` (200, empty array). Network logs confirm: no `x-session-token` header on the `/rest/v1/...` calls.

## Fix Plan

Single concern: make every Supabase request include `x-session-token` whenever a session exists. No data restoration needed.

1. **Switch to a wrapped fetch in the Supabase client.**
   Since `src/integrations/supabase/client.ts` is auto-generated and must not be edited, attach the header by replacing `window.fetch` for Supabase URLs from `AuthContext`:
   - On app load and on login: install a `fetch` wrapper that, for any request to `${VITE_SUPABASE_URL}`, injects `x-session-token: <token from localStorage>`.
   - On logout: uninstall the wrapper (or have it no-op when no token is stored).
   - Read the token from `localStorage` inside the wrapper on every call (so it stays fresh and survives reloads).

2. **Keep storage uploads working.**
   The wrapper applies to all Supabase URLs (`/rest`, `/storage`, `/functions`), which is exactly what we want — storage and edge functions also rely on the session for RLS / auth checks.

3. **Verification (after switch to default mode):**
   - Reload preview, log in with `najoommarket` / `Faisal@@7`.
   - Confirm Customers page shows 10 rows, Invoices 154, Payments 16.
   - Inspect a `/rest/v1/customers` request — header `x-session-token` must be present.
   - Test creating a new invoice and uploading an image still work.

4. **No DB migration. No edge function change. No data restore.** Everything is recoverable purely by fixing how the header is sent.

## Files to edit

- `src/contexts/AuthContext.tsx` — replace the broken `setSessionHeader` with a global `fetch` wrapper installed once on mount and updated on login/logout.

That's the entire fix. Your 10 customers / 154 invoices / 16 payments will reappear immediately after this change.

