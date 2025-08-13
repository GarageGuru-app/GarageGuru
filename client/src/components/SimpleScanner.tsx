import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Camera, Type, Flashlight } from "lucide-react";

interface SimpleScannerProps {
  onScan: (code: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function SimpleScanner({ onScan, isOpen, onClose }: SimpleScannerProps) {
  const [error, setError] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return stopCamera;
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError("");
      setStatus("Starting camera...");

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 }
        }
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        videoRef.current.onloadeddata = () => {
          setStatus("Camera ready - scanning...");
          startScanning();
        };

        await videoRef.current.play();
      }

    } catch (err: any) {
      console.error("Camera error:", err);
      setError("Camera access failed. Please allow camera permission.");
      setStatus("");
    }
  };

  const startScanning = () => {
    if (!videoRef.current) return;

    scanIntervalRef.current = window.setInterval(async () => {
      if (videoRef.current && stream) {
        await detectCode();
      }
    }, 800);
  };

  const detectCode = async () => {
    if (!videoRef.current) return;

    try {
      // Method 1: Try native BarcodeDetector
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8']
        });
        
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes && barcodes.length > 0) {
          console.log("Native detector found:", barcodes[0].rawValue);
          handleScanResult(barcodes[0].rawValue);
          return;
        }
      }
    } catch (err) {
      console.log("Native detector failed, trying alternatives");
    }

    try {
      // Method 2: Try qr-scanner library
      const QrScanner = await import('qr-scanner');
      const result = await QrScanner.default.scanImage(videoRef.current);
      
      console.log("QR Scanner found:", result);
      handleScanResult(result);
      
    } catch (err) {
      // Normal when no code found
    }
  };

  const handleScanResult = (result: string) => {
    if (result && result.trim()) {
      setStatus("Code detected!");
      console.log("Scan successful:", result);
      onScan(result.trim());
      onClose();
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    setStatus("");
    setTorchEnabled(false);
  };

  const toggleTorch = async () => {
    if (!stream) return;
    
    try {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      
      if ((capabilities as any).torch) {
        await track.applyConstraints({
          advanced: [{ torch: !torchEnabled } as any]
        });
        setTorchEnabled(!torchEnabled);
      }
    } catch (err) {
      console.log("Torch not supported");
    }
  };

  const handleManualInput = () => {
    const code = prompt("Enter code manually:");
    if (code && code.trim()) {
      onScan(code.trim());
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Camera className="w-5 h-5" />
              <span>Scan Code</span>
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            Point camera at QR code or barcode
            {status && (
              <div className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                {status}
              </div>
            )}
          </div>
          
          <div className="relative border-2 border-dashed border-primary/30 rounded-lg overflow-hidden aspect-video bg-black">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            
            {/* Scanning overlay */}
            {stream && (
              <div className="absolute inset-4 border-2 border-green-500 rounded-lg">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-500"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-500"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-500"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-500"></div>
              </div>
            )}
            
            {/* Torch button */}
            {stream && (
              <div className="absolute top-2 right-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={toggleTorch}
                  className="bg-black/50 text-white border-none"
                >
                  <Flashlight className={`w-4 h-4 ${torchEnabled ? 'text-yellow-400' : ''}`} />
                </Button>
              </div>
            )}
            
            {!stream && !error && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <div className="text-sm">Starting camera...</div>
                </div>
              </div>
            )}
          </div>
          
          {error && (
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="text-sm text-red-600 dark:text-red-400 mb-2">
                {error}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={startCamera}
              >
                Try Again
              </Button>
            </div>
          )}
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleManualInput}
              className="flex-1"
            >
              <Type className="w-4 h-4 mr-2" />
              Enter Manually
            </Button>
            <Button 
              variant="secondary" 
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}