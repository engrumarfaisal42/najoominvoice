import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useInvoices } from '@/hooks/useInvoices';
import { usePayments } from '@/hooks/usePayments';
import { useCustomers } from '@/hooks/useCustomers';
import { format } from 'date-fns';
import { Search, Calendar, DollarSign, FileText, ExternalLink, Filter, CheckSquare, X, Send, CreditCard } from 'lucide-react';
import BatchSendDialog from '@/components/invoice/BatchSendDialog';
import PaymentResendDialog from '@/components/history/PaymentResendDialog';

const statusColors = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  sent: 'bg-primary/10 text-primary border-primary/20',
  paid: 'bg-success/10 text-success border-success/20',
  objected: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function History() {
  const { invoices, isLoading: invoicesLoading, updateInvoice } = useInvoices();
  const { payments, isLoading: paymentsLoading } = usePayments();
  const { customers } = useCustomers();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchSendOpen, setBatchSendOpen] = useState(false);
  const [resendInvoice, setResendInvoice] = useState<typeof invoices[0] | null>(null);
  const [resendPayment, setResendPayment] = useState<typeof payments[0] | null>(null);
  const [activeTab, setActiveTab] = useState('invoices');

  const getCustomerForPayment = (customerId: string) => {
    return customers.find(c => c.id === customerId);
  };

  const filtered = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer?.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPayments = payments.filter(p => {
    const customer = getCustomerForPayment(p.customer_id);
    if (!customer) return false;
    return customer.name.toLowerCase().includes(search.toLowerCase());
  });

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    await updateInvoice.mutateAsync({ 
      id: invoiceId, 
      status: newStatus as 'pending' | 'sent' | 'paid' | 'objected' 
    });
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const selectedInvoices = invoices.filter(inv => selectedIds.has(inv.id));
  const isLoading = invoicesLoading || paymentsLoading;

  return (
    <AppLayout title="History">
      <div className="space-y-4 pb-20">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-10 h-12"
            />
          </div>
          {activeTab === 'invoices' && (
            <>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] h-12">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="objected">Objected</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={selectionMode ? 'destructive' : 'outline'}
                size="icon"
                className="h-12 w-12 shrink-0"
                onClick={selectionMode ? exitSelectionMode : () => setSelectionMode(true)}
              >
                {selectionMode ? <X className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
              </Button>
            </>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); exitSelectionMode(); }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Invoices ({invoices.length})
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payments ({payments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="mt-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filtered.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  {search || statusFilter !== 'all' ? 'No invoices found' : 'No invoices yet'}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filtered.map((invoice) => (
                  <Card
                    key={invoice.id}
                    className={selectionMode && selectedIds.has(invoice.id) ? 'ring-2 ring-primary' : ''}
                    onClick={selectionMode ? () => toggleSelection(invoice.id) : undefined}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          {selectionMode && (
                            <Checkbox
                              checked={selectedIds.has(invoice.id)}
                              onCheckedChange={() => toggleSelection(invoice.id)}
                              className="mt-1"
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {invoice.customer?.name || 'Unknown Customer'}
                            </h3>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <FileText className="w-3.5 h-3.5" />
                              <span>{invoice.invoice_number}</span>
                            </div>
                          </div>
                        </div>
                        {!selectionMode && (
                          <Select 
                            value={invoice.status} 
                            onValueChange={(value) => handleStatusChange(invoice.id, value)}
                          >
                            <SelectTrigger className="w-auto h-8 px-2">
                              <Badge 
                                variant="outline" 
                                className={statusColors[invoice.status]}
                              >
                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="sent">Sent</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="objected">Objected</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {selectionMode && (
                          <Badge 
                            variant="outline" 
                            className={statusColors[invoice.status]}
                          >
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(invoice.invoice_date), 'dd/MM/yyyy')}
                          </span>
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <DollarSign className="w-3.5 h-3.5" />
                            {Number(invoice.amount).toFixed(2)} SAR
                          </span>
                        </div>
                        {!selectionMode && (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setResendInvoice(invoice)}
                              title="Resend via WhatsApp"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                            {invoice.image_url && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(invoice.image_url!, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {invoice.sent_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Sent: {format(new Date(invoice.sent_at), 'dd/MM/yyyy HH:mm')}
                          {invoice.language === 'arabic' ? ' (Arabic)' : ' (English)'}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredPayments.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  {search ? 'No payments found' : 'No payments yet'}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredPayments.map((payment) => {
                  const customer = getCustomerForPayment(payment.customer_id);
                  if (!customer) return null;
                  return (
                    <Card key={payment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-foreground">{customer.name}</h3>
                            {payment.notes && (
                              <p className="text-sm text-muted-foreground mt-1">{payment.notes}</p>
                            )}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={payment.sent_at 
                              ? 'bg-success/10 text-success border-success/20' 
                              : 'bg-warning/10 text-warning border-warning/20'}
                          >
                            {payment.sent_at ? 'Sent' : 'Not Sent'}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4 text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {format(new Date(payment.payment_date), 'dd/MM/yyyy')}
                            </span>
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              <DollarSign className="w-3.5 h-3.5" />
                              {Number(payment.amount).toFixed(2)} SAR
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setResendPayment(payment)}
                            title="Send/Resend via WhatsApp"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>

                        {payment.sent_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Sent: {format(new Date(payment.sent_at), 'dd/MM/yyyy HH:mm')}
                            {payment.language === 'arabic' ? ' (Arabic)' : ' (English)'}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Selection bottom bar */}
        {selectionMode && selectedIds.size > 0 && (
          <div className="fixed bottom-20 left-0 right-0 bg-background border-t p-4 flex items-center justify-between z-50">
            <span className="text-sm font-medium">
              {selectedIds.size} invoice(s) selected
            </span>
            <Button
              onClick={() => setBatchSendOpen(true)}
              className="h-10 bg-[hsl(142,70%,49%)] hover:bg-[hsl(142,70%,45%)]"
            >
              <Send className="w-4 h-4 mr-2" />
              Send via WhatsApp
            </Button>
          </div>
        )}

        <BatchSendDialog
          open={batchSendOpen}
          onOpenChange={(open) => {
            setBatchSendOpen(open);
            if (!open) exitSelectionMode();
          }}
          selectedInvoices={selectedInvoices}
        />

        {resendInvoice && (
          <BatchSendDialog
            open={!!resendInvoice}
            onOpenChange={(open) => {
              if (!open) setResendInvoice(null);
            }}
            selectedInvoices={[resendInvoice]}
          />
        )}

        {resendPayment && (() => {
          const customer = getCustomerForPayment(resendPayment.customer_id);
          if (!customer) return null;
          return (
            <PaymentResendDialog
              open={!!resendPayment}
              onOpenChange={(open) => {
                if (!open) setResendPayment(null);
              }}
              payment={resendPayment}
              customer={customer}
            />
          );
        })()}
      </div>
    </AppLayout>
  );
}
