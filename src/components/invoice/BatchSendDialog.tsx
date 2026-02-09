import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { generateWhatsAppMessage, createWhatsAppUrl } from '@/lib/whatsappMessage';
import { useInvoices } from '@/hooks/useInvoices';
import { usePayments } from '@/hooks/usePayments';
import { Invoice } from '@/types';
import { Send, Copy, Check, ArrowRight, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BatchSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedInvoices: Invoice[];
}

export default function BatchSendDialog({ open, onOpenChange, selectedInvoices }: BatchSendDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [language, setLanguage] = useState<'english' | 'arabic'>('english');
  const [copied, setCopied] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { invoices, updateInvoice } = useInvoices();
  const { getTotalPayments } = usePayments();

  const current = selectedInvoices[currentIndex];
  const isAllDone = currentIndex >= selectedInvoices.length;

  const getTotalBalance = (invoice: Invoice) => {
    const customerId = invoice.customer_id;
    const totalInvoiceAmount = invoices
      .filter(inv => inv.customer_id === customerId)
      .reduce((sum, inv) => sum + Number(inv.amount), 0);
    const totalPaid = getTotalPayments(customerId);
    return totalInvoiceAmount - totalPaid;
  };

  const handleSend = async () => {
    if (!current?.customer) return;
    const totalBalance = getTotalBalance(current);
    const message = generateWhatsAppMessage({
      customerName: current.customer.name,
      customerNameAr: current.customer.name_ar,
      invoiceDate: current.invoice_date,
      invoiceNumber: current.invoice_number,
      currentAmount: Number(current.amount),
      totalBalance,
      imageUrl: current.image_url || '',
      language,
    });
    const url = createWhatsAppUrl(current.customer.phone, message);
    window.open(url, '_blank');

    await updateInvoice.mutateAsync({
      id: current.id,
      status: 'sent',
      sent_at: new Date().toISOString(),
      language,
    });

    setSentIds(prev => new Set(prev).add(current.id));
  };

  const handleNext = () => {
    setCurrentIndex(prev => prev + 1);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!current?.customer) return;
    const totalBalance = getTotalBalance(current);
    const message = generateWhatsAppMessage({
      customerName: current.customer.name,
      customerNameAr: current.customer.name_ar,
      invoiceDate: current.invoice_date,
      invoiceNumber: current.invoice_number,
      currentAmount: Number(current.amount),
      totalBalance,
      imageUrl: current.image_url || '',
      language,
    });
    await navigator.clipboard.writeText(message);
    setCopied(true);
    toast({ title: 'Message copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setCurrentIndex(0);
    setSentIds(new Set());
    setCopied(false);
    onOpenChange(false);
  };

  const progress = (currentIndex / selectedInvoices.length) * 100;

  if (!open) return null;

  const getMessage = () => {
    if (!current?.customer) return '';
    const totalBalance = getTotalBalance(current);
    return generateWhatsAppMessage({
      customerName: current.customer.name,
      customerNameAr: current.customer.name_ar,
      invoiceDate: current.invoice_date,
      invoiceNumber: current.invoice_number,
      currentAmount: Number(current.amount),
      totalBalance,
      imageUrl: current.image_url || '',
      language,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isAllDone ? 'All Done!' : `Sending ${currentIndex + 1} of ${selectedInvoices.length}`}
          </DialogTitle>
        </DialogHeader>

        <Progress value={isAllDone ? 100 : progress} className="h-2" />

        {isAllDone ? (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3" />
            <p className="text-muted-foreground">
              {sentIds.size} invoice(s) sent successfully
            </p>
            <Button onClick={handleClose} className="mt-4 w-full h-12">
              Done
            </Button>
          </div>
        ) : current?.customer ? (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{current.customer.name}</span>
              {' · '}
              {current.invoice_number}
              {' · '}
              {Number(current.amount).toFixed(2)} SAR
            </div>

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
                disabled={sentIds.has(current.id)}
              >
                <Send className="w-4 h-4 mr-2" />
                {sentIds.has(current.id) ? 'Sent' : 'Send'}
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={handleNext}
              className="w-full h-12"
            >
              {currentIndex < selectedInvoices.length - 1 ? (
                <>Next Invoice <ArrowRight className="w-4 h-4 ml-2" /></>
              ) : (
                'Finish'
              )}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
