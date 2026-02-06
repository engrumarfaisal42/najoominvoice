import { useMemo } from 'react';
import { useInvoices } from './useInvoices';
import { usePayments } from './usePayments';
import { useCustomers } from './useCustomers';

export interface CustomerBalance {
  customerId: string;
  totalInvoices: number;
  totalPayments: number;
  creditBalance: number;
  netBalance: number; // positive = owes money, negative = has credit
  unpaidInvoiceCount: number;
}

export function useCustomerBalance(customerId?: string) {
  const { invoices } = useInvoices();
  const { payments } = usePayments();
  const { customers } = useCustomers();

  const getBalance = useMemo(() => {
    return (custId: string): CustomerBalance => {
      const customer = customers.find(c => c.id === custId);
      const customerInvoices = invoices.filter(inv => inv.customer_id === custId);
      const customerPayments = payments.filter(p => p.customer_id === custId);

      const totalInvoices = customerInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
      const totalPayments = customerPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const creditBalance = Number(customer?.credit_balance ?? 0);
      
      // Net balance = invoices - payments - credit
      // Positive means customer owes money, negative means overpaid
      const netBalance = totalInvoices - totalPayments - creditBalance;
      const unpaidInvoiceCount = customerInvoices.filter(inv => inv.status !== 'paid').length;

      return {
        customerId: custId,
        totalInvoices,
        totalPayments,
        creditBalance,
        netBalance: Math.max(0, netBalance), // Show 0 if overpaid (credit will show separately)
        unpaidInvoiceCount,
      };
    };
  }, [invoices, payments, customers]);

  const balance = useMemo(() => {
    if (customerId) {
      return getBalance(customerId);
    }
    return null;
  }, [customerId, getBalance]);

  // Calculate total outstanding across all customers
  const totalOutstanding = useMemo(() => {
    const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const totalPaymentAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalCredit = customers.reduce((sum, c) => sum + Number(c.credit_balance ?? 0), 0);
    return Math.max(0, totalInvoiceAmount - totalPaymentAmount - totalCredit);
  }, [invoices, payments, customers]);

  // Get all customers with outstanding balance
  const customersWithBalance = useMemo(() => {
    return customers
      .map(c => ({
        customer: c,
        balance: getBalance(c.id),
      }))
      .filter(item => item.balance.netBalance > 0);
  }, [customers, getBalance]);

  return {
    balance,
    getBalance,
    totalOutstanding,
    customersWithBalance,
  };
}
