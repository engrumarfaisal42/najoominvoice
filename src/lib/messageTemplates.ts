import { format } from 'date-fns';
import { formatSaudiPhone } from './phoneFormat';
import { Customer, Invoice } from '@/types';
import { Payment } from '@/hooks/usePayments';

interface PaymentReceivedParams {
  customerName: string;
  customerNameAr?: string;
  paymentAmount: number;
  paymentDate: string;
  remainingBalance: number;
  language: 'english' | 'arabic';
}

export function generatePaymentReceivedMessage(params: PaymentReceivedParams): string {
  const {
    customerName,
    customerNameAr,
    paymentAmount,
    paymentDate,
    remainingBalance,
    language,
  } = params;

  const displayName = language === 'arabic' && customerNameAr ? customerNameAr : customerName;
  const formattedDate = format(new Date(paymentDate), 'dd/MM/yyyy');

  if (language === 'arabic') {
    return `السلام عليكم ${displayName} 👋

شكراً لكم على الدفع ✅

📅 تاريخ الدفع: ${formattedDate}
💵 المبلغ المستلم: ${paymentAmount.toFixed(2)} ريال
📊 الرصيد المتبقي: ${remainingBalance.toFixed(2)} ريال

${remainingBalance > 0 
  ? '⚠️ يرجى ملاحظة أنه لا يزال هناك رصيد مستحق.' 
  : '🎉 تم تسديد جميع المستحقات. شكراً لكم!'}

سوق نجوم 🙏`;
  }

  return `Hello ${displayName} 👋

Thank you for your payment ✅

📅 Payment Date: ${formattedDate}
💵 Amount Received: ${paymentAmount.toFixed(2)} SAR
📊 Remaining Balance: ${remainingBalance.toFixed(2)} SAR

${remainingBalance > 0 
  ? '⚠️ Please note there is still an outstanding balance.' 
  : '🎉 Your account is now fully paid. Thank you!'}

Najoom Market 🙏`;
}

interface PaymentReminderParams {
  customerName: string;
  customerNameAr?: string;
  totalBalance: number;
  unpaidInvoicesCount: number;
  oldestInvoiceDate?: string;
  language: 'english' | 'arabic';
}

export function generatePaymentReminderMessage(params: PaymentReminderParams): string {
  const {
    customerName,
    customerNameAr,
    totalBalance,
    unpaidInvoicesCount,
    oldestInvoiceDate,
    language,
  } = params;

  const displayName = language === 'arabic' && customerNameAr ? customerNameAr : customerName;
  const oldestDate = oldestInvoiceDate ? format(new Date(oldestInvoiceDate), 'dd/MM/yyyy') : '';

  if (language === 'arabic') {
    return `السلام عليكم ${displayName} 👋

نود تذكيركم بالمستحقات المتأخرة:

📊 إجمالي الرصيد المستحق: ${totalBalance.toFixed(2)} ريال
🧾 عدد الفواتير غير المسددة: ${unpaidInvoicesCount}
${oldestDate ? `📅 أقدم فاتورة: ${oldestDate}` : ''}

نرجو منكم التكرم بتسوية المبالغ المستحقة في أقرب وقت ممكن.

شكراً لتعاونكم 🙏
سوق نجوم`;
  }

  return `Hello ${displayName} 👋

This is a friendly reminder about your outstanding balance:

📊 Total Outstanding Balance: ${totalBalance.toFixed(2)} SAR
🧾 Number of Unpaid Invoices: ${unpaidInvoicesCount}
${oldestDate ? `📅 Oldest Invoice: ${oldestDate}` : ''}

We kindly request you to settle the outstanding amount at your earliest convenience.

Thank you for your cooperation 🙏
Najoom Market`;
}

interface StatementParams {
  customerName: string;
  customerNameAr?: string;
  invoices: Invoice[];
  payments: Payment[];
  totalInvoices: number;
  totalPayments: number;
  currentBalance: number;
  language: 'english' | 'arabic';
}

export function generateStatementMessage(params: StatementParams): string {
  const {
    customerName,
    customerNameAr,
    invoices,
    payments,
    totalInvoices,
    totalPayments,
    currentBalance,
    language,
  } = params;

  const displayName = language === 'arabic' && customerNameAr ? customerNameAr : customerName;
  const today = format(new Date(), 'dd/MM/yyyy');

  if (language === 'arabic') {
    let message = `السلام عليكم ${displayName} 👋

📋 *كشف حساب*
📅 التاريخ: ${today}

━━━━━━━━━━━━━━━━━
📥 *الفواتير:*
`;

    if (invoices.length === 0) {
      message += `لا توجد فواتير\n`;
    } else {
      invoices.slice(0, 10).forEach((inv, i) => {
        const date = format(new Date(inv.invoice_date), 'dd/MM');
        const status = inv.status === 'paid' ? '✅' : '⏳';
        message += `${i + 1}. ${date} | #${inv.invoice_number} | ${Number(inv.amount).toFixed(2)} ر.س ${status}\n`;
      });
      if (invoices.length > 10) {
        message += `... و ${invoices.length - 10} فواتير أخرى\n`;
      }
    }

    message += `
━━━━━━━━━━━━━━━━━
📤 *المدفوعات:*
`;

    if (payments.length === 0) {
      message += `لا توجد مدفوعات\n`;
    } else {
      payments.slice(0, 5).forEach((p, i) => {
        const date = format(new Date(p.payment_date), 'dd/MM');
        message += `${i + 1}. ${date} | ${Number(p.amount).toFixed(2)} ر.س ✅\n`;
      });
      if (payments.length > 5) {
        message += `... و ${payments.length - 5} مدفوعات أخرى\n`;
      }
    }

    message += `
━━━━━━━━━━━━━━━━━
📊 *الملخص:*
💰 إجمالي الفواتير: ${totalInvoices.toFixed(2)} ر.س
💵 إجمالي المدفوعات: ${totalPayments.toFixed(2)} ر.س
📈 الرصيد الحالي: ${currentBalance.toFixed(2)} ر.س

سوق نجوم 🏪`;

    return message;
  }

  let message = `Hello ${displayName} 👋

📋 *Account Statement*
📅 Date: ${today}

━━━━━━━━━━━━━━━━━
📥 *Invoices:*
`;

  if (invoices.length === 0) {
    message += `No invoices\n`;
  } else {
    invoices.slice(0, 10).forEach((inv, i) => {
      const date = format(new Date(inv.invoice_date), 'dd/MM');
      const status = inv.status === 'paid' ? '✅' : '⏳';
      message += `${i + 1}. ${date} | #${inv.invoice_number} | ${Number(inv.amount).toFixed(2)} SAR ${status}\n`;
    });
    if (invoices.length > 10) {
      message += `... and ${invoices.length - 10} more invoices\n`;
    }
  }

  message += `
━━━━━━━━━━━━━━━━━
📤 *Payments:*
`;

  if (payments.length === 0) {
    message += `No payments\n`;
  } else {
    payments.slice(0, 5).forEach((p, i) => {
      const date = format(new Date(p.payment_date), 'dd/MM');
      message += `${i + 1}. ${date} | ${Number(p.amount).toFixed(2)} SAR ✅\n`;
    });
    if (payments.length > 5) {
      message += `... and ${payments.length - 5} more payments\n`;
    }
  }

  message += `
━━━━━━━━━━━━━━━━━
📊 *Summary:*
💰 Total Invoices: ${totalInvoices.toFixed(2)} SAR
💵 Total Payments: ${totalPayments.toFixed(2)} SAR
📈 Current Balance: ${currentBalance.toFixed(2)} SAR

Najoom Market 🏪`;

  return message;
}

export function createWhatsAppUrl(phone: string, message: string): string {
  const formattedPhone = formatSaudiPhone(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}
