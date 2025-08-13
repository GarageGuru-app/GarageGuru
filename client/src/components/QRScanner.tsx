import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, QrCode, Type, Flashlight } from "lucide-react";

interface QRScannerProps {
  onScan: (code: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function QRScanner({ onScan, isOpen, onClose }: QRScannerProps) {
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
          facingMode: { exact: "environment" },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        }
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded, dimensions:", videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight);
          setStatus("Camera ready - scanning for QR codes...");
          // Wait a bit for video to be fully ready
          setTimeout(startScanning, 500);
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
    console.log("Starting QR scanning...");

    scanIntervalRef.current = window.setInterval(async () => {
      if (videoRef.current && stream) {
        console.log("Attempting QR detection... Video ready:", videoRef.current?.readyState, "Dimensions:", videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight);
        await detectQRCode();
      }
    }, 1200);
  };

  const detectQRCode = async () => {
    if (!videoRef.current || !stream) return;

    try {
      // Create a canvas to capture the current frame
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size to match video
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      
      // Draw current video frame to canvas
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      // Method 1: Use qr-scanner library with video element (most reliable without native API)
      try {
        const QrScanner = await import('qr-scanner');
        const result = await QrScanner.default.scanImage(videoRef.current);
        
        if (result && result.trim()) {
          console.log("QR Scanner video found:", result);
          handleScanResult(result);
          return;
        }
      } catch (err) {
        // Continue to next method
      }

      // Method 2: Use qr-scanner library with canvas
      try {
        const QrScanner = await import('qr-scanner');
        const result = await QrScanner.default.scanImage(canvas);
        
        if (result && result.trim()) {
          console.log("QR Scanner canvas found:", result);
          handleScanResult(result);
          return;
        }
      } catch (err) {
        // Continue to next method
      }

      // Method 3: Use canvas as ImageData
      try {
        const QrScanner = await import('qr-scanner');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = await QrScanner.default.scanImage(imageData);
        
        if (result && result.trim()) {
          console.log("QR Scanner ImageData found:", result);
          handleScanResult(result);
        }
      } catch (err) {
        // Normal when no QR code found
      }
      
    } catch (err) {
      console.log("Detection error:", err);
    }
  };

  const handleScanResult = (result: string) => {
    if (result && result.trim()) {
      setStatus("QR code detected!");
      console.log("QR scan successful:", result);
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
    const code = prompt("Enter QR code manually:");
    if (code && code.trim()) {
      onScan(code.trim());
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto" aria-describedby="qr-scanner-description">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <QrCode className="w-5 h-5" />
              <span>Scan QR Code</span>
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div id="qr-scanner-description" className="text-center text-sm text-muted-foreground">
            Point camera at any <strong>QR code</strong>
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
            
            {/* QR Code scanning overlay */}
            {stream && (
              <div className="absolute inset-4 border-2 border-blue-500 rounded-lg">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-500 text-xs font-medium">
                  QR
                </div>
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