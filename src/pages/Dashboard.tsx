import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCustomers } from '@/hooks/useCustomers';
import { useInvoices } from '@/hooks/useInvoices';
import { useCustomerBalance } from '@/hooks/useCustomerBalance';
import { useBackup } from '@/hooks/useBackup';
import { 
  Camera, 
  Users, 
  FileText, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Download
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { customers } = useCustomers();
  const { invoices } = useInvoices();
  const { totalOutstanding } = useCustomerBalance();
  const { downloadBackup, isLoading: isBackingUp } = useBackup();

  const stats = {
    totalCustomers: customers.length,
    totalInvoices: invoices.length,
    pendingInvoices: invoices.filter(i => i.status === 'pending').length,
    sentInvoices: invoices.filter(i => i.status === 'sent').length,
    paidInvoices: invoices.filter(i => i.status === 'paid').length,
    totalOutstanding,
  };

  const recentInvoices = invoices.slice(0, 3);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center py-4">
          <h1 className="text-2xl font-bold text-foreground">Najoom Market</h1>
          <p className="text-muted-foreground">Invoice WhatsApp Messenger</p>
        </div>

        {/* Quick Action */}
        <Button 
          onClick={() => navigate('/capture')} 
          className="w-full h-14 text-lg font-semibold"
          size="lg"
        >
          <Camera className="w-6 h-6 mr-3" />
          Capture New Invoice
        </Button>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/customers')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalCustomers}</p>
                  <p className="text-xs text-muted-foreground">Customers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/history')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalInvoices}</p>
                  <p className="text-xs text-muted-foreground">Invoices</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingInvoices + stats.sentInvoices}</p>
                  <p className="text-xs text-muted-foreground">Unpaid</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.paidInvoices}</p>
                  <p className="text-xs text-muted-foreground">Paid</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Outstanding Balance */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Outstanding</p>
                <p className="text-3xl font-bold text-primary">
                  {stats.totalOutstanding.toFixed(2)} <span className="text-lg">SAR</span>
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-primary/50" />
            </div>
          </CardContent>
        </Card>

        {/* Backup Button */}
        <Button
          onClick={downloadBackup}
          disabled={isBackingUp}
          variant="outline"
          className="w-full h-12"
        >
          <Download className="w-5 h-5 mr-2" />
          {isBackingUp ? 'Preparing Backup...' : 'Backup Data'}
        </Button>

        {/* Recent Invoices */}
        {recentInvoices.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                Recent Invoices
                <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentInvoices.map((invoice) => (
                <div 
                  key={invoice.id} 
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">{invoice.customer?.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{invoice.invoice_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{Number(invoice.amount).toFixed(2)} SAR</p>
                    <p className="text-xs text-muted-foreground capitalize">{invoice.status}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
