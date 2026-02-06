-- Add credit_balance column to customers for overpayment handling
ALTER TABLE public.customers 
ADD COLUMN credit_balance numeric NOT NULL DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.customers.credit_balance IS 'Stores overpayment amount that can be used for future invoices';