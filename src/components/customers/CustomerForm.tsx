import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Customer } from '@/types';
import { displayPhone, validateSaudiPhone, formatSaudiPhone } from '@/lib/phoneFormat';
import { UserPlus, Save } from 'lucide-react';

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: { name: string; phone: string }) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export default function CustomerForm({ customer, onSubmit, onCancel, isLoading }: CustomerFormProps) {
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [phoneError, setPhoneError] = useState('');

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (value && !validateSaudiPhone(value)) {
      setPhoneError('Please enter a valid Saudi mobile number');
    } else {
      setPhoneError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSaudiPhone(phone)) {
      setPhoneError('Please enter a valid Saudi mobile number');
      return;
    }
    onSubmit({ name, phone: formatSaudiPhone(phone) });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          {customer ? 'Edit Customer' : 'Add New Customer'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Customer Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter customer name"
              className="h-12"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (+966)</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="05X XXX XXXX"
              className={`h-12 ${phoneError ? 'border-destructive' : ''}`}
              required
            />
            {phone && !phoneError && (
              <p className="text-sm text-muted-foreground">
                Will be saved as: {displayPhone(phone)}
              </p>
            )}
            {phoneError && (
              <p className="text-sm text-destructive">{phoneError}</p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-12">
                Cancel
              </Button>
            )}
            <Button type="submit" className="flex-1 h-12" disabled={isLoading || !!phoneError}>
              <Save className="w-4 h-4 mr-2" />
              {customer ? 'Update' : 'Add Customer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
