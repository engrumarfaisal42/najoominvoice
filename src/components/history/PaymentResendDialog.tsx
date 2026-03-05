import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generatePaymentReceivedMessage, createWhatsAppUrl } from '@/lib/messageTemplates';
import { usePayments, Payment } from '@/hooks/usePayments';
import { useInvoices } from '@/hooks/useInvoices';
import { Customer } from '@/types';
import { Send, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentResendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment;
  customer: Customer;
}

export default function PaymentResendDialog({ open, onOpenChange, payment, customer }: PaymentResendDialogProps) {
  const [language, setLanguage] = useState<'english' | 'arabic'>('english');
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const { markPaymentSent } = usePayments();
  const { invoices } = useInvoices();
  const { getTotalPayments } = usePayments();

  const getRemainingBalance = () => {
    const totalInvoiceAmount = invoices
      .filter(inv => inv.customer_id === customer.id)
      .reduce((sum, inv) => sum + Number(inv.amount), 0);
    const totalPaid = getTotalPayments(customer.id);
    return Math.max(0, totalInvoiceAmount - totalPaid);
  };

  const getMessage = () => {
    return generatePaymentReceivedMessage({
      customerName: customer.name,
      customerNameAr: customer.name_ar,
      paymentAmount: Number(payment.amount),
      paymentDate: payment.payment_date,
      remainingBalance: getRemainingBalance(),
      language,
    });
  };

  const handleSend = async () => {
    const message = getMessage();
    const url = createWhatsAppUrl(customer.phone, message);
    window.open(url, '_blank');

    if (!payment.sent_at) {
      await markPaymentSent.mutateAsync({ id: payment.id, language });
    }
    setSent(true);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getMessage());
    setCopied(true);
    toast({ title: 'Message copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setSent(false);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resend Payment Receipt</DialogTitle>
          <DialogDescription>
            {customer.name} · {Number(payment.amount).toFixed(2)} SAR
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs value={language} onValueChange={(v) => setLanguage(v as 'english' | 'arabic')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="english">🇬🇧 English</TabsTrigger>
              <TabsTrigger value="arabic">🇸🇦 العربية</TabsTrigger>
            </TabsList>
            <TabsContent value="english" className="mt-4">
              <div className="bg-muted rounded-lg p-4 whitespace-pre-wrap text-sm max-h-48 overflow-y-auto" dir="ltr">
                {getMessage()}
              </div>
            </TabsContent>
            <TabsContent value="arabic" className="mt-4">
              <div className="bg-muted rounded-lg p-4 whitespace-pre-wrap text-sm max-h-48 overflow-y-auto" dir="rtl">
                {getMessage()}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCopy} className="flex-1 h-12">
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button
              onClick={handleSend}
              className="flex-1 h-12 bg-[hsl(142,70%,49%)] hover:bg-[hsl(142,70%,45%)]"
            >
              <Send className="w-4 h-4 mr-2" />
              {sent ? 'Send Again' : 'Send via WhatsApp'}
            </Button>
          </div>

          <Button variant="outline" onClick={handleClose} className="w-full h-12">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
