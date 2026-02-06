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
    getTotalPayments,
  };
}
