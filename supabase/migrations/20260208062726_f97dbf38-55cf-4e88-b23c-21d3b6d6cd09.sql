
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
