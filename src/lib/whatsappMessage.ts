import { format, addDays } from 'date-fns';
import { formatSaudiPhone } from './phoneFormat';

interface MessageParams {
  customerName: string;
  invoiceDate: string;
  invoiceNumber: string;
  currentAmount: number;
  totalBalance: number;
  imageUrl: string;
  language: 'english' | 'arabic';
}

export function generateWhatsAppMessage(params: MessageParams): string {
  const {
    customerName,
    invoiceDate,
    invoiceNumber,
    currentAmount,
    totalBalance,
    imageUrl,
    language,
  } = params;

  const objectionDeadline = format(addDays(new Date(invoiceDate), 7), 'dd/MM/yyyy');
  
  if (language === 'arabic') {
    return `السلام عليكم ${customerName} 👋

نود إعلامكم بتفاصيل الفاتورة الجديدة:

📅 تاريخ الفاتورة: ${format(new Date(invoiceDate), 'dd/MM/yyyy')}
🧾 رقم الفاتورة: ${invoiceNumber}
💵 مبلغ الفاتورة الحالية: ${currentAmount.toFixed(2)} ريال
📊 إجمالي الرصيد المستحق: ${totalBalance.toFixed(2)} ريال

🔗 لمشاهدة الفاتورة:
${imageUrl}

⚠️ ملاحظة مهمة: في حال وجود أي اعتراض على الفاتورة، يرجى إبلاغنا خلال 7 أيام من تاريخ الفاتورة (قبل ${objectionDeadline})

شكراً لتعاملكم معنا 🙏
سوق نجوم`;
  }

  return `Hello ${customerName} 👋

We would like to inform you about your new invoice:

📅 Invoice Date: ${format(new Date(invoiceDate), 'dd/MM/yyyy')}
🧾 Invoice Number: ${invoiceNumber}
💵 Current Invoice Amount: ${currentAmount.toFixed(2)} SAR
📊 Total Outstanding Balance: ${totalBalance.toFixed(2)} SAR

🔗 View Invoice:
${imageUrl}

⚠️ Important Notice: If you have any objections regarding this invoice, please notify us within 7 days from the invoice date (before ${objectionDeadline})

Thank you for your business 🙏
Najoom Market`;
}

export function createWhatsAppUrl(phone: string, message: string): string {
  const formattedPhone = formatSaudiPhone(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}
