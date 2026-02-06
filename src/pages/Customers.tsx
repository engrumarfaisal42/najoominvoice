import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import CustomerForm from '@/components/customers/CustomerForm';
import CustomerList from '@/components/customers/CustomerList';
import { Button } from '@/components/ui/button';
import { useCustomers } from '@/hooks/useCustomers';
import { useInvoices } from '@/hooks/useInvoices';
import { Customer } from '@/types';
import { Plus, X } from 'lucide-react';

export default function Customers() {
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const { customers, isLoading, createCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const { getCustomerBalance } = useInvoices();

  const handleSubmit = async (data: { name: string; phone: string }) => {
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
            getBalance={getCustomerBalance}
          />
        )}
      </div>
    </AppLayout>
  );
}
