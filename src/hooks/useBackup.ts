import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useBackup() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const downloadBackup = async () => {
    setIsLoading(true);
    try {
      const [customersRes, invoicesRes, paymentsRes] = await Promise.all([
        supabase.from('customers').select('*').order('name'),
        supabase.from('invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('payments').select('*').order('created_at', { ascending: false }),
      ]);

      if (customersRes.error) throw customersRes.error;
      if (invoicesRes.error) throw invoicesRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      const backup = {
        backup_date: new Date().toISOString(),
        customers: customersRes.data,
        invoices: invoicesRes.data,
        payments: paymentsRes.data,
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `najoom-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: 'Backup downloaded successfully' });
    } catch (error) {
      toast({ title: 'Failed to create backup', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return { downloadBackup, isLoading };
}
