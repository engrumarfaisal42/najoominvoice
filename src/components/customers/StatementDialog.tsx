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
import { Payment } from '@/hooks/usePayments';
import { generateStatementMessage, createWhatsAppUrl } from '@/lib/messageTemplates';
import { Send, Copy, Check, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StatementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  invoices: Invoice[];
  payments: Payment[];
}

export default function StatementDialog({ 
  open, 
  onOpenChange, 
  customer,
  invoices,
  payments,
}: StatementDialogProps) {
  const { toast } = useToast();
  const [language, setLanguage] = useState<'english' | 'arabic'>('english');
  const [copied, setCopied] = useState(false);

  const totalInvoices = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const currentBalance = totalInvoices - totalPayments;

  const message = generateStatementMessage({
    customerName: customer.name,
    customerNameAr: (customer as any).name_ar,
    invoices,
    payments,
    totalInvoices,
    totalPayments,
    currentBalance,
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
            <FileText className="w-5 h-5" />
            Customer Statement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Customer</p>
            <p className="font-medium">{customer.name}</p>
            {(customer as any).name_ar && (
              <p className="text-sm text-muted-foreground" dir="rtl">{(customer as any).name_ar}</p>
            )}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t text-center">
              <div>
                <p className="text-xs text-muted-foreground">Invoices</p>
                <p className="font-medium text-sm">{totalInvoices.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="font-medium text-sm text-green-600">{totalPayments.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className={`font-medium text-sm ${currentBalance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {currentBalance.toFixed(0)}
                </p>
              </div>
            </div>
          </div>

          <Tabs value={language} onValueChange={(v) => setLanguage(v as 'english' | 'arabic')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="english">🇬🇧 English</TabsTrigger>
              <TabsTrigger value="arabic">🇸🇦 العربية</TabsTrigger>
            </TabsList>
            <TabsContent value="english" className="mt-4">
              <div 
                className="bg-muted rounded-lg p-4 whitespace-pre-wrap text-sm max-h-64 overflow-y-auto font-mono text-xs"
                dir="ltr"
              >
                {message}
              </div>
            </TabsContent>
            <TabsContent value="arabic" className="mt-4">
              <div 
                className="bg-muted rounded-lg p-4 whitespace-pre-wrap text-sm max-h-64 overflow-y-auto font-mono text-xs"
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
