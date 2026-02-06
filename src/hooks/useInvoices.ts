import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function useInvoices(customerId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: invoices = [], isLoading, error } = useQuery({
    queryKey: ['invoices', customerId],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(*)
        `)
        .order('created_at', { ascending: false });
      
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Invoice[];
    },
  });

  const createInvoice = useMutation({
    mutationFn: async (invoice: {
      customer_id: string;
      invoice_number: string;
      invoice_date: string;
      amount: number;
      image_url?: string;
      language?: 'english' | 'arabic';
    }) => {
      const { data, error } = await supabase
        .from('invoices')
        .insert(invoice)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Invoice created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create invoice', variant: 'destructive' });
    },
  });

  const updateInvoice = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Invoice> & { id: string }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Invoice updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update invoice', variant: 'destructive' });
    },
  });

  const getCustomerBalance = (customerId: string) => {
    return invoices
      .filter(inv => inv.customer_id === customerId && inv.status !== 'paid')
      .reduce((sum, inv) => sum + Number(inv.amount), 0);
  };

  return {
    invoices,
    isLoading,
    error,
    createInvoice,
    updateInvoice,
    getCustomerBalance,
  };
}
