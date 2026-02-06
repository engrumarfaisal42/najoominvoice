import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import CustomerForm from '@/components/customers/CustomerForm';
import CustomerList from '@/components/customers/CustomerList';
import PaymentDialog from '@/components/customers/PaymentDialog';
import ReminderDialog from '@/components/customers/ReminderDialog';
import StatementDialog from '@/components/customers/StatementDialog';
import { Button } from '@/components/ui/button';
import { useCustomers } from '@/hooks/useCustomers';
import { useInvoices } from '@/hooks/useInvoices';
import { usePayments } from '@/hooks/usePayments';
import { Customer, Invoice } from '@/types';
import { Plus, X } from 'lucide-react';

export default function Customers() {
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [reminderCustomer, setReminderCustomer] = useState<Customer | null>(null);
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);
  
  const { customers, isLoading, createCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const { invoices, getCustomerBalance } = useInvoices();
  const { payments, getTotalPayments } = usePayments();

  // Calculate net balance (invoices - payments)
  const getNetBalance = (customerId: string) => {
    const totalInvoices = invoices
      .filter(inv => inv.customer_id === customerId)
      .reduce((sum, inv) => sum + Number(inv.amount), 0);
    const totalPaid = getTotalPayments(customerId);
    return totalInvoices - totalPaid;
  };

  const handleSubmit = async (data: { name: string; name_ar?: string; phone: string }) => {
    if (editingCustomer) {
      await updateCustomer.mutateAsync({ id: editingCustomer.id, ...data });
    } else {
      await createCustomer.mutateAsync(data);
    }
    setShowForm(false);
    setEditingCustomer(null);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCustomer(null);
  };

  // Get customer-specific data for dialogs
  const getCustomerInvoices = (customerId: string): Invoice[] => {
    return invoices.filter(inv => inv.customer_id === customerId);
  };

  const getUnpaidInvoices = (customerId: string): Invoice[] => {
    return invoices.filter(inv => inv.customer_id === customerId && inv.status !== 'paid');
  };

  const getCustomerPayments = (customerId: string) => {
    return payments.filter(p => p.customer_id === customerId);
  };

  return (
    <AppLayout title="Customers">
      <div className="space-y-4">
        {!showForm && (
          <Button 
            onClick={() => setShowForm(true)} 
            className="w-full h-12 text-base"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Customer
          </Button>
        )}

        {showForm ? (
          <div className="relative">
            <Button
              size="icon"
              variant="ghost"
              className="absolute -top-2 -right-2 z-10"
              onClick={handleCancel}
            >
              <X className="w-5 h-5" />
            </Button>
            <CustomerForm
              customer={editingCustomer || undefined}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={createCustomer.isPending || updateCustomer.isPending}
            />
          </div>
        ) : isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading customers...</div>
        ) : (
          <CustomerList
            customers={customers}
            onEdit={handleEdit}
            onDelete={(id) => deleteCustomer.mutate(id)}
            getBalance={getNetBalance}
            onPayment={(customer) => setPaymentCustomer(customer)}
            onReminder={(customer) => setReminderCustomer(customer)}
            onStatement={(customer) => setStatementCustomer(customer)}
          />
        )}
      </div>

      {/* Payment Dialog */}
      {paymentCustomer && (
        <PaymentDialog
          open={!!paymentCustomer}
          onOpenChange={(open) => !open && setPaymentCustomer(null)}
          customer={paymentCustomer}
          currentBalance={getNetBalance(paymentCustomer.id)}
        />
      )}

      {/* Reminder Dialog */}
      {reminderCustomer && (
        <ReminderDialog
          open={!!reminderCustomer}
          onOpenChange={(open) => !open && setReminderCustomer(null)}
          customer={reminderCustomer}
          unpaidInvoices={getUnpaidInvoices(reminderCustomer.id)}
          totalBalance={getNetBalance(reminderCustomer.id)}
        />
      )}

      {/* Statement Dialog */}
      {statementCustomer && (
        <StatementDialog
          open={!!statementCustomer}
          onOpenChange={(open) => !open && setStatementCustomer(null)}
          customer={statementCustomer}
          invoices={getCustomerInvoices(statementCustomer.id)}
          payments={getCustomerPayments(statementCustomer.id)}
        />
      )}
    </AppLayout>
  );
}
