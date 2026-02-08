import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface BackupData {
  backup_date: string;
  customers: Array<{
    id: string;
    name: string;
    name_ar?: string | null;
    phone: string;
    credit_balance: number;
    created_at: string;
    updated_at: string;
  }>;
  invoices: Array<{
    id: string;
    customer_id: string;
    invoice_number: string;
    invoice_date: string;
    amount: number;
    image_url?: string | null;
    status: string;
    sent_at?: string | null;
    language?: string | null;
    created_at: string;
    updated_at: string;
  }>;
  payments: Array<{
    id: string;
    customer_id: string;
    amount: number;
    payment_date: string;
    notes?: string | null;
    language?: string | null;
    sent_at?: string | null;
    created_at: string;
    updated_at: string;
  }>;
}

function isValidBackup(data: unknown): data is BackupData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.backup_date === 'string' &&
    Array.isArray(d.customers) &&
    Array.isArray(d.invoices) &&
    Array.isArray(d.payments)
  );
}

export function useRestore() {
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<BackupData | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const parseFile = (file: File): Promise<BackupData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string);
          if (!isValidBackup(parsed)) {
            reject(new Error('Invalid backup file format'));
            return;
          }
          resolve(parsed);
        } catch {
          reject(new Error('Could not parse JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const loadPreview = async (file: File) => {
    try {
      const data = await parseFile(file);
      setPreview(data);
    } catch (error: any) {
      toast({ title: error.message || 'Invalid backup file', variant: 'destructive' });
      setPreview(null);
    }
  };

  const restoreData = async () => {
    if (!preview) return;
    setIsLoading(true);
    try {
      // Upsert customers first (invoices & payments depend on them)
      if (preview.customers.length > 0) {
        const { error } = await supabase
          .from('customers')
          .upsert(preview.customers, { onConflict: 'id' });
        if (error) throw error;
      }

      // Then upsert invoices and payments in parallel
      const promises = [];
      if (preview.invoices.length > 0) {
        promises.push(
          supabase.from('invoices').upsert(preview.invoices, { onConflict: 'id' })
        );
      }
      if (preview.payments.length > 0) {
        promises.push(
          supabase.from('payments').upsert(preview.payments, { onConflict: 'id' })
        );
      }

      const results = await Promise.all(promises);
      for (const res of results) {
        if (res.error) throw res.error;
      }

      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();

      toast({ title: 'Data restored successfully' });
      setPreview(null);
    } catch (error) {
      console.error('Restore error:', error);
      toast({ title: 'Failed to restore data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const clearPreview = () => setPreview(null);

  return { loadPreview, restoreData, clearPreview, preview, isLoading };
}
