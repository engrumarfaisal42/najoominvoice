
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
