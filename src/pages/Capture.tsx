import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import CameraCapture from '@/components/invoice/CameraCapture';
import InvoiceForm from '@/components/invoice/InvoiceForm';
import MessagePreview from '@/components/invoice/MessagePreview';
import CustomerList from '@/components/customers/CustomerList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCustomers } from '@/hooks/useCustomers';
import { useInvoices } from '@/hooks/useInvoices';
import { usePayments } from '@/hooks/usePayments';
import { supabase } from '@/integrations/supabase/client';
import { Customer, ExtractedInvoiceData, Invoice } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, CheckCircle } from 'lucide-react';

type Step = 'customer' | 'capture' | 'review' | 'preview' | 'done';

export default function Capture() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { customers } = useCustomers();
  const { invoices, createInvoice } = useInvoices();
  const { getTotalPayments } = usePayments();
  
  const [step, setStep] = useState<Step>('customer');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedInvoiceData | null>(null);
  const [capturedImage, setCapturedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setStep('capture');
  };

  const handleCapture = async (imageBase64: string, file: File) => {
    setCapturedImage(file);
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('extract-invoice', {
        body: { imageBase64 },
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        setExtractedData({
          invoice_number: data.data.invoice_number || '',
          invoice_date: data.data.invoice_date || '',
          amount: data.data.amount || '',
        });
        toast({ title: 'Invoice data extracted successfully!' });
      } else {
        toast({ 
          title: 'Could not extract data automatically',
          description: 'Please enter the details manually',
        });
      }
    } catch (error) {
      console.error('Extraction error:', error);
      toast({ 
        title: 'Extraction failed',
        description: 'Please enter the details manually',
        variant: 'destructive',
      });
    }

    setIsProcessing(false);
    setStep('review');
  };

  const handleInvoiceSubmit = async (data: { invoice_number: string; invoice_date: string; amount: number }) => {
    if (!selectedCustomer || !capturedImage) return;

    setIsUploading(true);

    try {
      // Upload image to storage
      const fileName = `${selectedCustomer.id}/${Date.now()}_${capturedImage.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(fileName, capturedImage);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);

      // Create invoice record
      const result = await createInvoice.mutateAsync({
        customer_id: selectedCustomer.id,
        invoice_number: data.invoice_number,
        invoice_date: data.invoice_date,
        amount: data.amount,
        image_url: publicUrl,
      });

      // Auto-apply existing credit to the new invoice
      const currentCredit = Number(selectedCustomer.credit_balance ?? 0);
      if (currentCredit > 0.01) {
        const invoiceAmount = data.amount;
        if (currentCredit >= invoiceAmount) {
          // Credit fully covers the invoice — mark paid, reduce credit
          await supabase.from('invoices').update({ status: 'paid' }).eq('id', result.id);
          const newCredit = Math.round((currentCredit - invoiceAmount) * 100) / 100;
          await supabase.from('customers').update({ credit_balance: Math.abs(newCredit) < 0.01 ? 0 : newCredit }).eq('id', selectedCustomer.id);
          toast({ title: 'Credit applied', description: `Invoice auto-paid from ${currentCredit.toFixed(2)} SAR credit` });
        } else {
          // Credit partially covers — use all credit, invoice stays pending
          await supabase.from('customers').update({ credit_balance: 0 }).eq('id', selectedCustomer.id);
          toast({ title: 'Credit applied', description: `${currentCredit.toFixed(2)} SAR credit applied, remaining due: ${(invoiceAmount - currentCredit).toFixed(2)} SAR` });
        }
      }

      setCreatedInvoice(result as Invoice);
      setStep('preview');
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({ 
        title: 'Failed to create invoice',
        variant: 'destructive',
      });
    }

    setIsUploading(false);
  };

  const handleMessageSent = async (language: 'english' | 'arabic') => {
    if (createdInvoice) {
      await supabase
        .from('invoices')
        .update({ 
          status: 'sent', 
          sent_at: new Date().toISOString(),
          language,
        })
        .eq('id', createdInvoice.id);
    }
    setStep('done');
  };

  const handleNewInvoice = () => {
    setStep('customer');
    setSelectedCustomer(null);
    setExtractedData(null);
    setCapturedImage(null);
    setImageUrl('');
    setCreatedInvoice(null);
  };

  // Calculate net balance for a customer (total invoices - total payments)
  const getNetBalance = (customerId: string) => {
    const totalInvoiceAmount = invoices
      .filter(inv => inv.customer_id === customerId)
      .reduce((sum, inv) => sum + Number(inv.amount), 0);
    const totalPaid = getTotalPayments(customerId);
    return totalInvoiceAmount - totalPaid;
  };

  // For the message preview, calculate total balance including the newly created invoice
  // Exclude the created invoice from existing invoices to avoid double-counting if it's already fetched
  const totalBalance = selectedCustomer && createdInvoice
    ? (() => {
        const existingInvoiceTotal = invoices
          .filter(inv => inv.customer_id === selectedCustomer.id && inv.id !== createdInvoice.id)
          .reduce((sum, inv) => sum + Number(inv.amount), 0);
        const totalPaid = getTotalPayments(selectedCustomer.id);
        return existingInvoiceTotal + Number(createdInvoice.amount) - totalPaid;
      })()
    : selectedCustomer
      ? getNetBalance(selectedCustomer.id)
      : 0;

  return (
    <AppLayout title="Capture Invoice">
      <div className="space-y-4">
        {step !== 'customer' && step !== 'done' && (
          <Button
            variant="ghost"
            onClick={() => {
              if (step === 'capture') setStep('customer');
              else if (step === 'review') setStep('capture');
              else if (step === 'preview') setStep('review');
            }}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}

        {step === 'customer' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Select Customer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose a customer to send the invoice to
                </p>
              </CardContent>
            </Card>
            <CustomerList
              customers={customers}
              onEdit={() => {}}
              onDelete={() => {}}
              onSelect={handleCustomerSelect}
              selectable
              getBalance={getNetBalance}
            />
            {customers.length === 0 && (
              <Button 
                variant="outline" 
                className="w-full h-12"
                onClick={() => navigate('/customers')}
              >
                Add Your First Customer
              </Button>
            )}
          </div>
        )}

        {step === 'capture' && selectedCustomer && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Customer: <span className="font-medium text-foreground">{selectedCustomer.name}</span>
                </p>
              </CardContent>
            </Card>
            <CameraCapture onCapture={handleCapture} isProcessing={isProcessing} />
          </div>
        )}

        {step === 'review' && selectedCustomer && (
          <InvoiceForm
            extractedData={extractedData || undefined}
            customer={selectedCustomer}
            onSubmit={handleInvoiceSubmit}
            isLoading={isUploading}
          />
        )}

        {step === 'preview' && selectedCustomer && createdInvoice && (
          <MessagePreview
            customer={selectedCustomer}
            invoice={createdInvoice}
            totalBalance={totalBalance}
            imageUrl={imageUrl}
            onSent={handleMessageSent}
          />
        )}

        {step === 'done' && (
          <Card>
            <CardContent className="py-8 text-center">
              <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Invoice Sent!</h2>
              <p className="text-muted-foreground mb-6">
                The invoice has been sent to {selectedCustomer?.name} via WhatsApp
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => {
                    setExtractedData(null);
                    setCapturedImage(null);
                    setImageUrl('');
                    setCreatedInvoice(null);
                    setStep('capture');
                  }}
                  className="w-full h-12"
                >
                  Add Another Invoice (Same Customer)
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/history')}
                    className="flex-1 h-12"
                  >
                    View History
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNewInvoice}
                    className="flex-1 h-12"
                  >
                    New Customer Invoice
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
