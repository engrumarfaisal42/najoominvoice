import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Customer } from '@/types';
import { usePayments } from '@/hooks/usePayments';
import { generatePaymentReceivedMessage, createWhatsAppUrl } from '@/lib/messageTemplates';
import { format } from 'date-fns';
import { DollarSign, Calendar, FileText, Send, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  currentBalance: number;
}

export default function PaymentDialog({ 
  open, 
  onOpenChange, 
  customer,
  currentBalance,
}: PaymentDialogProps) {
  const { toast } = useToast();
  const { createPayment, markPaymentSent } = usePayments();
  
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [language, setLanguage] = useState<'english' | 'arabic'>('english');
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [createdPaymentId, setCreatedPaymentId] = useState<string | null>(null);

  const remainingBalance = currentBalance - (parseFloat(amount) || 0);

  const message = generatePaymentReceivedMessage({
    customerName: customer.name,
    customerNameAr: (customer as any).name_ar,
    paymentAmount: parseFloat(amount) || 0,
    paymentDate,
    remainingBalance: Math.max(0, remainingBalance),
    language,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await createPayment.mutateAsync({
        customer_id: customer.id,
        amount: parseFloat(amount),
        payment_date: paymentDate,
        notes: notes || undefined,
        language,
      });
      
      setCreatedPaymentId(result.id);
      setStep('preview');
    } catch (error) {
      console.error('Failed to create payment:', error);
    }
  };

  const handleSend = async () => {
    const url = createWhatsAppUrl(customer.phone, message);
    window.open(url, '_blank');
    
    if (createdPaymentId) {
      await markPaymentSent.mutateAsync({ id: createdPaymentId, language });
    }
    
    handleClose();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    toast({ title: 'Message copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setAmount('');
    setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
    setNotes('');
    setStep('form');
    setCreatedPaymentId(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'form' ? '💵 Record Payment' : '📱 Send Receipt'}
          </DialogTitle>
        </DialogHeader>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{customer.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Current Balance: <span className="text-foreground font-medium">{currentBalance.toFixed(2)} SAR</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Amount Received (SAR)
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={currentBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-12"
                required
              />
              {amount && (
                <p className="text-sm text-muted-foreground">
                  Remaining: <span className={remainingBalance <= 0 ? 'text-green-600' : 'text-foreground'}>
                    {Math.max(0, remainingBalance).toFixed(2)} SAR
                  </span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Payment Date
              </Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes (optional)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment method, reference number, etc."
                rows={2}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12"
              disabled={createPayment.isPending || !amount}
            >
              {createPayment.isPending ? 'Recording...' : 'Record Payment & Preview Message'}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
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
        )}
      </DialogContent>
    </Dialog>
  );
}
