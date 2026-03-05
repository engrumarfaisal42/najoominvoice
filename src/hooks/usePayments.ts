import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Payment {
  id: string;
  customer_id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  language: 'english' | 'arabic';
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export function usePayments(customerId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: payments = [], isLoading, error } = useQuery({
    queryKey: ['payments', customerId],
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false });
      
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Payment[];
    },
  });

  const createPayment = useMutation({
    mutationFn: async (payment: {
      customer_id: string;
      amount: number;
      payment_date: string;
      notes?: string;
      language?: 'english' | 'arabic';
    }) => {
      const { data, error } = await supabase
        .from('payments')
        .insert(payment)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: 'Payment recorded successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to record payment', variant: 'destructive' });
    },
  });

  const markPaymentSent = useMutation({
    mutationFn: async ({ id, language }: { id: string; language: 'english' | 'arabic' }) => {
      const { data, error } = await supabase
        .from('payments')
        .update({ 
          sent_at: new Date().toISOString(),
          language,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  // Auto-mark invoices as paid and handle credit
  const processPayment = useMutation({
    mutationFn: async ({ 
      customerId, 
      paymentAmount 
    }: { 
      customerId: string; 
      paymentAmount: number;
    }) => {
      // Get all unpaid invoices for this customer, ordered by date (oldest first)
      const { data: unpaidInvoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', customerId)
        .neq('status', 'paid')
        .order('invoice_date', { ascending: true });
      
      if (invoicesError) throw invoicesError;

      // Get current customer data for credit balance
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('credit_balance')
        .eq('id', customerId)
        .single();
      
      if (customerError) throw customerError;

      // Calculate total due
      const totalDue = unpaidInvoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
      const currentCredit = Number(customer?.credit_balance || 0);
      
      // Available payment = new payment + existing credit
      let availablePayment = paymentAmount + currentCredit;
      const invoicesToPay: string[] = [];

      // Mark invoices as paid (oldest first)
      if (unpaidInvoices) {
        for (const invoice of unpaidInvoices) {
          if (availablePayment >= Number(invoice.amount)) {
            invoicesToPay.push(invoice.id);
            availablePayment -= Number(invoice.amount);
          } else {
            break; // Not enough to pay this invoice fully
          }
        }
      }

      // Update invoices to paid
      if (invoicesToPay.length > 0) {
        const { error: updateError } = await supabase
          .from('invoices')
          .update({ status: 'paid' })
          .in('id', invoicesToPay);
        
        if (updateError) throw updateError;
      }

      // Calculate remaining credit (if overpaid)
      const totalPaidInvoices = invoicesToPay.length > 0 && unpaidInvoices
        ? unpaidInvoices
            .filter(inv => invoicesToPay.includes(inv.id))
            .reduce((sum, inv) => sum + Number(inv.amount), 0)
        : 0;
      
      // Round to 2 decimals and clamp near-zero
      const rawCredit = paymentAmount + currentCredit - totalPaidInvoices;
      const newCredit = Math.abs(rawCredit) < 0.01 ? 0 : Math.round(rawCredit * 100) / 100;
      
      // Update customer credit balance
      const { error: creditError } = await supabase
        .from('customers')
        .update({ credit_balance: Math.max(0, newCredit) })
        .eq('id', customerId);
      
      if (creditError) throw creditError;

      return {
        invoicesPaid: invoicesToPay.length,
        creditBalance: Math.max(0, newCredit),
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      if (data.invoicesPaid > 0) {
        toast({ 
          title: `${data.invoicesPaid} invoice(s) marked as paid`,
          description: data.creditBalance > 0 
            ? `Credit balance: ${data.creditBalance.toFixed(2)} SAR` 
            : undefined,
        });
      }
    },
    onError: () => {
      toast({ title: 'Failed to process payment', variant: 'destructive' });
    },
  });

  const getTotalPayments = (customerId: string) => {
    return payments
      .filter(p => p.customer_id === customerId)
      .reduce((sum, p) => sum + Number(p.amount), 0);
  };

  return {
    payments,
    isLoading,
    error,
    createPayment,
    markPaymentSent,
    processPayment,
    getTotalPayments,
  };
}
