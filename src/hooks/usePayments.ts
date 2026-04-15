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
      // Get ALL invoices and payments for this customer to do proper account math
      const [{ data: allInvoices, error: invErr }, { data: allPayments, error: payErr }] = await Promise.all([
        supabase.from('invoices').select('*').eq('customer_id', customerId).order('invoice_date', { ascending: true }),
        supabase.from('payments').select('*').eq('customer_id', customerId),
      ]);
      if (invErr) throw invErr;
      if (payErr) throw payErr;

      const totalInvoices = (allInvoices || []).reduce((s, i) => s + Number(i.amount), 0);
      // totalPayments already includes the new payment we just inserted
      const totalPayments = (allPayments || []).reduce((s, p) => s + Number(p.amount), 0);

      // Net account: positive = customer owes, negative = customer has credit
      const net = Math.round((totalInvoices - totalPayments) * 100) / 100;
      const newCredit = net < 0 ? Math.abs(net) : 0;
      const clampedCredit = Math.abs(newCredit) < 0.01 ? 0 : newCredit;

      // Mark invoices as paid using FIFO (oldest first), up to what totalPayments covers
      let available = totalPayments;
      const invoicesToPay: string[] = [];
      const invoicesToUnpay: string[] = [];
      
      for (const inv of (allInvoices || [])) {
        if (available >= Number(inv.amount)) {
          invoicesToPay.push(inv.id);
          available -= Number(inv.amount);
        } else {
          invoicesToUnpay.push(inv.id);
        }
      }

      // Batch update invoice statuses
      if (invoicesToPay.length > 0) {
        const { error } = await supabase.from('invoices').update({ status: 'paid' }).in('id', invoicesToPay);
        if (error) throw error;
      }
      if (invoicesToUnpay.length > 0) {
        // Revert any that were incorrectly marked paid before
        const { error } = await supabase.from('invoices').update({ status: 'sent' }).in('id', invoicesToUnpay).eq('status', 'paid');
        if (error) throw error;
      }

      // Update customer credit balance
      const { error: creditError } = await supabase
        .from('customers')
        .update({ credit_balance: clampedCredit })
        .eq('id', customerId);
      if (creditError) throw creditError;

      return {
        invoicesPaid: invoicesToPay.length,
        creditBalance: clampedCredit,
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
