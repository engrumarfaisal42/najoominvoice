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
import { supabase } from '@/integrations/supabase/client';
import { Customer, ExtractedInvoiceData, Invoice } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, CheckCircle } from 'lucide-react';

type Step = 'customer' | 'capture' | 'review' | 'preview' | 'done';

export default function Capture() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { customers } = useCustomers();
  const { createInvoice, getCustomerBalance } = useInvoices();
  
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

  const totalBalance = selectedCustomer 
    ? getCustomerBalance(selectedCustomer.id) + (createdInvoice ? Number(createdInvoice.amount) : 0)
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
              getBalance={getCustomerBalance}
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
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate('/history')}
                  className="flex-1 h-12"
                >
                  View History
                </Button>
                <Button
                  onClick={handleNewInvoice}
                  className="flex-1 h-12"
                >
                  New Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
