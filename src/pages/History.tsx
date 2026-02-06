import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useInvoices } from '@/hooks/useInvoices';
import { format } from 'date-fns';
import { Search, Calendar, DollarSign, FileText, ExternalLink, Filter } from 'lucide-react';

const statusColors = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  sent: 'bg-primary/10 text-primary border-primary/20',
  paid: 'bg-success/10 text-success border-success/20',
  objected: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function History() {
  const { invoices, isLoading, updateInvoice } = useInvoices();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer?.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    await updateInvoice.mutateAsync({ 
      id: invoiceId, 
      status: newStatus as 'pending' | 'sent' | 'paid' | 'objected' 
    });
  };

  return (
    <AppLayout title="Invoice History">
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices..."
              className="pl-10 h-12"
            />
          </div>
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
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading invoices...</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {search || statusFilter !== 'all' ? 'No invoices found' : 'No invoices yet'}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((invoice) => (
              <Card key={invoice.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {invoice.customer?.name || 'Unknown Customer'}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{invoice.invoice_number}</span>
                      </div>
                    </div>
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
      </div>
    </AppLayout>
  );
}
