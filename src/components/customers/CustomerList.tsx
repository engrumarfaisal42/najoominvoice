import { useState } from 'react';
import { Customer, Invoice } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { displayPhone } from '@/lib/phoneFormat';
import { 
  Search, Phone, Edit, Trash2, ChevronRight, 
  DollarSign, Bell, FileText, MoreVertical, CreditCard 
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface CustomerListProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onSelect?: (customer: Customer) => void;
  selectable?: boolean;
  getBalance?: (customerId: string) => number;
  onPayment?: (customer: Customer) => void;
  onReminder?: (customer: Customer) => void;
  onStatement?: (customer: Customer) => void;
}

export default function CustomerList({ 
  customers, 
  onEdit, 
  onDelete, 
  onSelect,
  selectable = false,
  getBalance,
  onPayment,
  onReminder,
  onStatement,
}: CustomerListProps) {
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.name_ar && c.name_ar.includes(search)) ||
    c.phone.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers..."
          className="pl-10 h-12"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {search ? 'No customers found' : 'No customers yet. Add your first customer!'}
            </CardContent>
          </Card>
        ) : (
          filtered.map((customer) => {
            const balance = getBalance?.(customer.id) || 0;
            const creditBalance = Number(customer.credit_balance ?? 0);
            
            return (
              <Card 
                key={customer.id} 
                className={selectable ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}
                onClick={() => selectable && onSelect?.(customer)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{customer.name}</h3>
                      {customer.name_ar && (
                        <p className="text-sm text-muted-foreground truncate" dir="rtl">
                          {customer.name_ar}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{displayPhone(customer.phone)}</span>
                      </div>
                      {getBalance && (
                        <div className="mt-1 space-y-0.5">
                          <p className={`text-sm font-medium ${balance > 0 ? 'text-destructive' : 'text-success'}`}>
                            Balance: {balance.toFixed(2)} SAR
                          </p>
                          {creditBalance > 0 && (
                            <p className="text-xs text-success flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              Credit: {creditBalance.toFixed(2)} SAR
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    {selectable ? (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <div className="flex items-center gap-1">
                        {/* Quick action buttons for customers with balance */}
                        {balance > 0 && onPayment && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-success hover:text-success hover:bg-success/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPayment(customer);
                            }}
                            title="Record Payment"
                          >
                            <DollarSign className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {/* Dropdown for more actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(customer)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {onPayment && (
                              <DropdownMenuItem onClick={() => onPayment(customer)}>
                                <DollarSign className="w-4 h-4 mr-2" />
                                Record Payment
                              </DropdownMenuItem>
                            )}
                            {onReminder && balance > 0 && (
                              <DropdownMenuItem onClick={() => onReminder(customer)}>
                                <Bell className="w-4 h-4 mr-2" />
                                Send Reminder
                              </DropdownMenuItem>
                            )}
                            {onStatement && (
                              <DropdownMenuItem onClick={() => onStatement(customer)}>
                                <FileText className="w-4 h-4 mr-2" />
                                Send Statement
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteId(customer.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will also delete all invoices for this customer. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) onDelete(deleteId);
                setDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
