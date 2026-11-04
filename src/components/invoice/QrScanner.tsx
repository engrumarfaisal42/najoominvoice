import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface Props {
  onResult: (text: string) => void;
  onClose: () => void;
}

export default function QrScanner({ onResult, onClose }: Props) {
  const ref = useRef<Html5Qrcode | null>(null);
  const done = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    ref.current = scanner;
    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => {
          if (done.current) return;
          done.current = true;
          scanner.stop().catch(() => {}).finally(() => onResult(text));
        },
        () => {}
      )
      .catch((e) => setError(e?.message || 'Camera not available'));
    return () => {
      if (scanner.isScanning) scanner.stop().catch(() => {});
    };
  }, [onResult]);

  return (
    <div className="space-y-3">
      <div id="qr-reader" className="w-full overflow-hidden rounded-lg bg-muted min-h-[250px]" />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button variant="outline" className="w-full h-12" onClick={onClose}>
        <X className="w-4 h-4 mr-2" /> Cancel
      </Button>
    </div>
  );
}
