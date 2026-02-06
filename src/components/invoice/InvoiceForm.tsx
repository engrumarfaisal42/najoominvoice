import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExtractedInvoiceData, Customer } from '@/types';
import { Calendar, Hash, DollarSign, Check } from 'lucide-react';
import { format } from 'date-fns';

interface InvoiceFormProps {
  extractedData?: ExtractedInvoiceData;
  customer: Customer;
  onSubmit: (data: { invoice_number: string; invoice_date: string; amount: number }) => void;
  isLoading?: boolean;
}

export default function InvoiceForm({ extractedData, customer, onSubmit, isLoading }: InvoiceFormProps) {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (extractedData) {
      if (extractedData.invoice_number) setInvoiceNumber(extractedData.invoice_number);
      if (extractedData.invoice_date) setInvoiceDate(extractedData.invoice_date);
      if (extractedData.amount) setAmount(extractedData.amount);
    }
  }, [extractedData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      amount: parseFloat(amount),
    });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Invoice Details</CardTitle>
        <p className="text-sm text-muted-foreground">
          Customer: <span className="font-medium text-foreground">{customer.name}</span>
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber" className="flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Invoice Number
            </Label>
            <Input
              id="invoiceNumber"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="INV-001"
              className="h-12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoiceDate" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Invoice Date
            </Label>
            <Input
              id="invoiceDate"
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="h-12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Amount (SAR)
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="h-12"
              required
            />
          </div>

          <Button type="submit" className="w-full h-12" disabled={isLoading}>
            <Check className="w-4 h-4 mr-2" />
            {isLoading ? 'Creating...' : 'Confirm & Continue'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
