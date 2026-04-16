
-- 1. Create a security definer function to validate session tokens from request headers
CREATE OR REPLACE FUNCTION public.has_valid_session()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_session
    WHERE session_token = (current_setting('request.headers', true)::json->>'x-session-token')
      AND expires_at > now()
  );
$$;

-- 2. Drop all existing permissive policies
DROP POLICY IF EXISTS "Allow all operations on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow all operations on invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow all operations on payments" ON public.payments;
DROP POLICY IF EXISTS "Allow all operations on admin_session" ON public.admin_session;

-- 3. Create session-validated policies for customers
CREATE POLICY "Authenticated access to customers"
  ON public.customers FOR ALL
  USING (public.has_valid_session())
  WITH CHECK (public.has_valid_session());

-- 4. Create session-validated policies for invoices
CREATE POLICY "Authenticated access to invoices"
  ON public.invoices FOR ALL
  USING (public.has_valid_session())
  WITH CHECK (public.has_valid_session());

-- 5. Create session-validated policies for payments
CREATE POLICY "Authenticated access to payments"
  ON public.payments FOR ALL
  USING (public.has_valid_session())
  WITH CHECK (public.has_valid_session());

-- 6. Admin session: allow anonymous INSERT (for login), but restrict read/update/delete to valid sessions
CREATE POLICY "Anyone can create sessions"
  ON public.admin_session FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated access to read sessions"
  ON public.admin_session FOR SELECT
  USING (public.has_valid_session() OR session_token = (current_setting('request.headers', true)::json->>'x-session-token'));

CREATE POLICY "Authenticated access to delete sessions"
  ON public.admin_session FOR DELETE
  USING (public.has_valid_session());

-- 7. Storage: remove open write policies, keep public read
DROP POLICY IF EXISTS "Anyone can upload invoice images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update invoice images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete invoice images" ON storage.objects;

-- Replace with session-validated storage write policies
CREATE POLICY "Authenticated upload invoice images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'invoices' AND public.has_valid_session());

CREATE POLICY "Authenticated update invoice images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'invoices' AND public.has_valid_session());

CREATE POLICY "Authenticated delete invoice images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'invoices' AND public.has_valid_session());
