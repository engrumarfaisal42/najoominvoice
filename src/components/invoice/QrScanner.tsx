import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X, ImageUp } from 'lucide-react';

interface Props {
  onResult: (text: string) => void;
  onClose: () => void;
}

export default function QrScanner({ onResult, onClose }: Props) {
  const ref = useRef<Html5Qrcode | null>(null);
  const done = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader', {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      useBarCodeDetectorIfSupported: true,
      verbose: false,
    });
    ref.current = scanner;
    scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: (w, h) => {
            const s = Math.floor(Math.min(w, h) * 0.85);
            return { width: s, height: s };
          },
          videoConstraints: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            // @ts-expect-error focusMode is supported on many mobile browsers
            advanced: [{ focusMode: 'continuous' }],
          },
        },
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

  const handleFile = async (file?: File) => {
    if (!file || !ref.current) return;
    try {
      if (ref.current.isScanning) await ref.current.stop();
      const text = await ref.current.scanFile(file, false);
      done.current = true;
      onResult(text);
    } catch {
      setError('QR code not found in this photo. Try a closer, clearer photo.');
    }
  };

  return (
    <div className="space-y-3">
      <div id="qr-reader" className="w-full overflow-hidden rounded-lg bg-muted min-h-[250px]" />
      <p className="text-xs text-muted-foreground text-center">Hold the QR code close and steady inside the box</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      <Button variant="secondary" className="w-full h-12" onClick={() => fileRef.current?.click()}>
        <ImageUp className="w-4 h-4 mr-2" /> Scan QR from photo
      </Button>
      <Button variant="outline" className="w-full h-12" onClick={onClose}>
        <X className="w-4 h-4 mr-2" /> Cancel
      </Button>
    </div>
  );
}
