import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateWhatsAppMessage, createWhatsAppUrl } from '@/lib/whatsappMessage';
import { Customer, Invoice } from '@/types';
import { MessageSquare, Send, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MessagePreviewProps {
  customer: Customer;
  invoice: Invoice;
  totalBalance: number;
  imageUrl: string;
  onSent: (language: 'english' | 'arabic') => void;
}

export default function MessagePreview({ 
  customer, 
  invoice, 
  totalBalance, 
  imageUrl,
  onSent 
}: MessagePreviewProps) {
  const [language, setLanguage] = useState<'english' | 'arabic'>('english');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const message = generateWhatsAppMessage({
    customerName: customer.name,
    invoiceDate: invoice.invoice_date,
    invoiceNumber: invoice.invoice_number,
    currentAmount: Number(invoice.amount),
    totalBalance,
    imageUrl,
    language,
  });

  const handleSend = () => {
    const url = createWhatsAppUrl(customer.phone, message);
    window.open(url, '_blank');
    onSent(language);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    toast({ title: 'Message copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Message Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  );
}
