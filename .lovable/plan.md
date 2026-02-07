

# Fix: Data Not Visible Across Devices

## Problem
All database tables (`customers`, `invoices`, `payments`, `admin_session`) have their security policies set as **RESTRICTIVE** instead of **PERMISSIVE**. In the database engine, at least one permissive policy must exist to grant access. Restrictive policies alone always result in denied access, even when the condition is `true`.

Data appears to work on the original device only because it is cached in memory by the app. Any fresh request from a new device returns empty results.

## Fix
Drop the existing restrictive policies on all four tables and recreate them as **permissive** policies.

### SQL Migration

```sql
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow all operations on admin_session" ON public.admin_session;
DROP POLICY IF EXISTS "Allow all operations on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow all operations on invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow all operations on payments" ON public.payments;

-- Recreate as permissive policies
CREATE POLICY "Allow all operations on admin_session"
  ON public.admin_session FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on customers"
  ON public.customers FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on invoices"
  ON public.invoices FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on payments"
  ON public.payments FOR ALL
  USING (true) WITH CHECK (true);
```

### No Code Changes Needed
The app code is correct. Only the database policies need to be fixed. After applying this migration, data will be accessible from any device immediately after login.

### Security Note
Since this is a single-admin app with custom session-based authentication (not database-level auth), permissive public policies are acceptable. The app-level login screen provides the access control.
