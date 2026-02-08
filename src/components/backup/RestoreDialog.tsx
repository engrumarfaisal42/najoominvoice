import { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, AlertTriangle } from 'lucide-react';
import { useRestore } from '@/hooks/useRestore';

interface RestoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RestoreDialog({ open, onOpenChange }: RestoreDialogProps) {
  const { loadPreview, restoreData, clearPreview, preview, isLoading } = useRestore();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadPreview(file);
  };

  const handleRestore = async () => {
    await restoreData();
    onOpenChange(false);
  };

  const handleClose = (value: boolean) => {
    if (!value) {
      clearPreview();
      if (fileRef.current) fileRef.current.value = '';
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Restore Backup</DialogTitle>
          <DialogDescription>
            Upload a backup JSON file to restore your data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Tap to select backup file
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {preview && (
            <div className="space-y-3">
              <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                <p><strong>Backup date:</strong> {new Date(preview.backup_date).toLocaleString()}</p>
                <p><strong>Customers:</strong> {preview.customers.length}</p>
                <p><strong>Invoices:</strong> {preview.invoices.length}</p>
                <p><strong>Payments:</strong> {preview.payments.length}</p>
              </div>

              <div className="flex items-start gap-2 bg-warning/10 border border-warning/30 rounded-lg p-3">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Existing records with matching IDs will be overwritten. New records will be added.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleRestore} disabled={!preview || isLoading}>
            {isLoading ? 'Restoring...' : 'Restore Data'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
