import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, ImageUp } from 'lucide-react';
import { decodeCanvas, decodeFile } from '@/lib/qr-decode';

interface Props {
  onResult: (text: string) => void;
  onClose: () => void;
}

/** Live camera QR scanner (same engine as Scan & Save: BarcodeDetector → ZXing WASM → jsQR). */
export default function QrScanner({ onResult, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const stoppedRef = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    stoppedRef.current = false;
    const canvas = document.createElement('canvas');
    let frame = 0;

    const loop = async () => {
      if (stoppedRef.current) return;
      const v = videoRef.current;
      if (v && v.readyState >= 2 && v.videoWidth) {
        const mode = frame++ % 3;
        const vw = v.videoWidth, vh = v.videoHeight;
        const full = mode === 1;
        const side = Math.min(vw, vh) * (mode === 2 ? 0.5 : 0.75);
        const sw = full ? vw : side, sh = full ? vh : side;
        const sx = (vw - sw) / 2, sy = (vh - sh) / 2;
        const scale = Math.min(1, 1600 / Math.max(sw, sh));
        canvas.width = Math.round(sw * scale);
        canvas.height = Math.round(sh * scale);
        canvas.getContext('2d', { willReadFrequently: true })!.drawImage(v, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        const text = await decodeCanvas(canvas, frame % 6 === 0);
        if (text && !stoppedRef.current) {
          stoppedRef.current = true;
          navigator.vibrate?.(80);
          stream?.getTracks().forEach((t) => t.stop());
          onResult(text);
          return;
        }
      }
      timer = setTimeout(loop, 120);
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        if (stoppedRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }
        const track = stream.getVideoTracks()[0];
        try {
          await track?.applyConstraints({ advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet] });
        } catch { /* autofocus not supported */ }
        const v = videoRef.current!;
        v.srcObject = stream;
        await v.play();
        loop();
      } catch (e) {
        setError((e as Error)?.message || 'Camera not available');
      }
    })();

    return () => {
      stoppedRef.current = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onResult]);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setError('');
    try {
      const text = await decodeFile(file);
      if (!text) throw new Error();
      stoppedRef.current = true;
      onResult(text);
    } catch {
      setError('QR code not found in this photo. Try a closer, clearer photo.');
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-[12%] rounded-xl border-4 border-primary/80" />
      </div>
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
