import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Customer, Invoice } from '@/types';
import { generatePaymentReminderMessage, createWhatsAppUrl } from '@/lib/messageTemplates';
import { Send, Copy, Check, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  unpaidInvoices: Invoice[];
  totalBalance: number;
}

export default function ReminderDialog({ 
  open, 
  onOpenChange, 
  customer,
  unpaidInvoices,
  totalBalance,
}: ReminderDialogProps) {
  const { toast } = useToast();
  const [language, setLanguage] = useState<'english' | 'arabic'>('english');
  const [copied, setCopied] = useState(false);

  const oldestInvoice = unpaidInvoices.length > 0 
    ? unpaidInvoices.reduce((oldest, inv) => 
        new Date(inv.invoice_date) < new Date(oldest.invoice_date) ? inv : oldest
      )
    : null;

  const message = generatePaymentReminderMessage({
    customerName: customer.name,
    customerNameAr: (customer as any).name_ar,
    totalBalance,
    unpaidInvoicesCount: unpaidInvoices.length,
    oldestInvoiceDate: oldestInvoice?.invoice_date,
    language,
  });

  const handleSend = () => {
    const url = createWhatsAppUrl(customer.phone, message);
    window.open(url, '_blank');
    onOpenChange(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    toast({ title: 'Message copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Payment Reminder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Customer</p>
            <p className="font-medium">{customer.name}</p>
            {(customer as any).name_ar && (
              <p className="text-sm text-muted-foreground" dir="rtl">{(customer as any).name_ar}</p>
            )}
            <div className="mt-2 pt-2 border-t">
              <p className="text-sm">
                <span className="text-muted-foreground">Outstanding:</span>{' '}
                <span className="font-medium text-destructive">{totalBalance.toFixed(2)} SAR</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Unpaid Invoices:</span>{' '}
                <span className="font-medium">{unpaidInvoices.length}</span>
              </p>
            </div>
          </div>

          <Tabs value={language} onValueChange={(v) => setLanguage(v as 'english' | 'arabic')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="english">🇬🇧 English</TabsTrigger>
              <TabsTrigger value="arabic">🇸🇦 العربية</TabsTrigger>
            </TabsList>
            <TabsContent value="english" className="mt-4">
              <div 
                className="bg-muted rounded-lg p-4 whitespace-pre-wrap text-sm max-h-64 overflow-y-auto"
                dir="ltr"
              >
                {message}
              </div>
            </TabsContent>
            <TabsContent value="arabic" className="mt-4">
              <div 
                className="bg-muted rounded-lg p-4 whitespace-pre-wrap text-sm max-h-64 overflow-y-auto"
                dir="rtl"
              >
                {message}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCopy}
              className="flex-1 h-12"
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button
              onClick={handleSend}
              className="flex-1 h-12 bg-[hsl(142,70%,49%)] hover:bg-[hsl(142,70%,45%)]"
            >
              <Send className="w-4 h-4 mr-2" />
              Send via WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
