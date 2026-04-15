import { useMemo } from 'react';
import { useInvoices } from './useInvoices';
import { usePayments } from './usePayments';
import { useCustomers } from './useCustomers';

export interface CustomerBalance {
  customerId: string;
  totalInvoices: number;
  totalPayments: number;
  due: number;       // amount customer still owes (0 if overpaid)
  credit: number;    // true excess after all invoices covered (0 if underpaid)
  unpaidInvoiceCount: number;
}

/** Round to 2 decimals and clamp near-zero */
function money(v: number): number {
  const r = Math.round(v * 100) / 100;
  return Math.abs(r) < 0.01 ? 0 : r;
}

export function useCustomerBalance(customerId?: string) {
  const { invoices } = useInvoices();
  const { payments } = usePayments();
  const { customers } = useCustomers();

  const getBalance = useMemo(() => {
    return (custId: string): CustomerBalance => {
      const customerInvoices = invoices.filter(inv => inv.customer_id === custId);
      const customerPayments = payments.filter(p => p.customer_id === custId);

      const totalInvoices = money(customerInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0));
      const totalPayments = money(customerPayments.reduce((sum, p) => sum + Number(p.amount), 0));

      // Simple account math: net = invoices - payments
      const net = money(totalInvoices - totalPayments);
      const unpaidInvoiceCount = customerInvoices.filter(inv => inv.status !== 'paid').length;

      return {
        customerId: custId,
        totalInvoices,
        totalPayments,
        due: net > 0 ? net : 0,
        credit: net < 0 ? Math.abs(net) : 0,
        unpaidInvoiceCount,
      };
    };
  }, [invoices, payments]);

  const balance = useMemo(() => {
    if (customerId) return getBalance(customerId);
    return null;
  }, [customerId, getBalance]);

  const totalOutstanding = useMemo(() => {
    const totalInv = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const totalPay = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    return money(Math.max(0, totalInv - totalPay));
  }, [invoices, payments]);

  const customersWithBalance = useMemo(() => {
    return customers
      .map(c => ({ customer: c, balance: getBalance(c.id) }))
      .filter(item => item.balance.due > 0);
  }, [customers, getBalance]);

  return { balance, getBalance, totalOutstanding, customersWithBalance };
}
