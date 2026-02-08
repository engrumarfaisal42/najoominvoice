

# Fix Database Access Policies

## The Problem
All four tables (`admin_session`, `customers`, `invoices`, `payments`) have their security policies set as **RESTRICTIVE** instead of **PERMISSIVE**. In PostgreSQL, restrictive policies alone grant zero access — they only narrow down existing permissions. Without a permissive policy, no data can be read or written, which is why:
- Login fails (can't save session token)
- No data shows on any device after login

## The Fix
Drop the existing restrictive policies and replace them with permissive ones on all four tables.

## Technical Details

### Database Migration (SQL)
Drop and recreate the policies for all four tables:

```text
-- admin_session
DROP POLICY IF EXISTS "Allow all operations on admin_session" ON public.admin_session;
CREATE POLICY "Allow all operations on admin_session" ON public.admin_session FOR ALL USING (true) WITH CHECK (true);

-- customers
DROP POLICY IF EXISTS "Allow all operations on customers" ON public.customers;
CREATE POLICY "Allow all operations on customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);

-- invoices
DROP POLICY IF EXISTS "Allow all operations on invoices" ON public.invoices;
CREATE POLICY "Allow all operations on invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);

-- payments
DROP POLICY IF EXISTS "Allow all operations on payments" ON public.payments;
CREATE POLICY "Allow all operations on payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);
```

No code changes needed. This is a database-only fix. After applying, the app will work on all devices immediately.
