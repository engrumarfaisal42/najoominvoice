export interface Customer {
  id: string;
  name: string;
  name_ar?: string;
  phone: string;
  credit_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  customer_id: string;
  invoice_number: string;
  invoice_date: string;
  amount: number;
  image_url: string | null;
  status: 'pending' | 'sent' | 'paid' | 'objected';
  sent_at: string | null;
  language: 'english' | 'arabic';
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface ExtractedInvoiceData {
  invoice_number: string;
  invoice_date: string;
  amount: string;
}
