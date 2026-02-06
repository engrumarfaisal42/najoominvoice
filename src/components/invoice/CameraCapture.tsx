import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, X, RotateCcw } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageBase64: string, file: File) => void;
  isProcessing?: boolean;
}

export default function CameraCapture({ onCapture, isProcessing }: CameraCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setCapturedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (preview && capturedFile) {
      // Extract just the base64 data without the data URL prefix
      const base64Data = preview.split(',')[1];
      onCapture(base64Data, capturedFile);
    }
  };

  const handleRetake = () => {
    setPreview(null);
    setCapturedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {preview ? (
          <div className="space-y-4">
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted">
              <img
                src={preview}
                alt="Captured invoice"
                className="w-full h-full object-contain"
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Extracting data...</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleRetake}
                className="flex-1 h-12"
                disabled={isProcessing}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 h-12"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Use This Photo'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div 
              className="aspect-[4/3] rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-center px-4">
                Tap to take a photo or upload an invoice image
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 h-12"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 h-12"
              >
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
