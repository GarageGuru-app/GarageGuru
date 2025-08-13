import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Scan, Flashlight, FlashlightOff, Type } from "lucide-react";

interface SimpleScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export function SimpleBarcodeScanner({ isOpen, onClose, onScan }: SimpleScannerProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [torchEnabled, setTorchEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanIntervalRef = useRef<number>();

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError("");
      setStatus("Starting camera...");

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },

          aspectRatio: 16/9
        }
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        
        // Wait for video metadata to load
        videoRef.current.addEventListener('loadedmetadata', () => {
          console.log("Video metadata loaded:", videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight);
          setStatus("Camera ready - point at barcode or QR code");
          startScanning();
        });
        
        // If already loaded, start immediately
        if (videoRef.current.readyState >= 2) {
          console.log("Video already ready:", videoRef.current.videoWidth, "x", videoRef.current.videoHeight);
          setStatus("Camera ready - point at barcode or QR code");
          startScanning();
        }
      }
    } catch (err) {
      setError("Camera access denied or unavailable");
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    setStatus("");
    setError("");
  };

  const startScanning = () => {
    console.log("Starting barcode scanning...");

    scanIntervalRef.current = window.setInterval(async () => {
      if (videoRef.current && stream) {
        await detectCode();
      }
    }, 800); // Faster scanning for better detection
  };

  const detectCode = async () => {
    if (!videoRef.current || !stream) return;

    const video = videoRef.current;
    
    // Check video state
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      console.log("Video not ready:", video.readyState, video.videoWidth, video.videoHeight);
      return;
    }

    try {
      console.log("Attempting detection - Video:", video.videoWidth + "x" + video.videoHeight);

      // Method 1: Direct video scanning with qr-scanner
      try {
        const QrScanner = await import('qr-scanner');
        console.log("Scanning video element directly...");
        const result = await QrScanner.default.scanImage(video);
        
        if (result && result.trim()) {
          console.log("✅ Code detected from video:", result);
          handleScanResult(result);
          return;
        }
      } catch (err) {
        console.log("Video scan failed:", err);
      }

      // Method 2: Canvas capture with enhanced processing
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Use higher resolution for better detection
        const scale = 2;
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;
        ctx.scale(scale, scale);
        
        // Enhance image contrast and sharpness
        ctx.filter = 'contrast(150%) brightness(110%)';
        ctx.drawImage(video, 0, 0);

        console.log("Created enhanced canvas:", canvas.width + "x" + canvas.height);

        const QrScanner = await import('qr-scanner');
        const result = await QrScanner.default.scanImage(canvas);
        
        if (result && result.trim()) {
          console.log("✅ Code detected from enhanced canvas:", result);
          handleScanResult(result);
          return;
        }
      } catch (err) {
        console.log("Enhanced canvas scan failed:", err);
      }

      // Method 3: Try with blob conversion
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
          }, 'image/png');
        });

        const QrScanner = await import('qr-scanner');
        const result = await QrScanner.default.scanImage(blob);
        
        if (result && result.trim()) {
          console.log("✅ Code detected from blob:", result);
          handleScanResult(result);
          return;
        }
      } catch (err) {
        console.log("Blob scan failed:", err);
      }

      // Only log every 5th attempt to reduce console spam
      if (Math.random() < 0.2) {
        console.log("❌ No code detected in this frame");
      }

    } catch (err) {
      console.log("Detection error:", err);
    }
  };

  const handleScanResult = (code: string) => {
    console.log("Scan successful:", code);
    stopCamera();
    onScan(code);
    onClose();
  };

  const toggleTorch = async () => {
    if (stream) {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.();
      
      if ((capabilities as any)?.torch) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !torchEnabled } as any]
          });
          setTorchEnabled(!torchEnabled);
        } catch (err) {
          console.log("Torch not supported");
        }
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto" aria-describedby="simple-scanner-description">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Scan className="w-5 h-5" />
              <span>Scan Code</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTorch}
              className="p-2"
            >
              {torchEnabled ? (
                <FlashlightOff className="w-4 h-4" />
              ) : (
                <Flashlight className="w-4 h-4" />
              )}
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div id="simple-scanner-description" className="text-center text-sm text-muted-foreground">
            Hold steady and point camera at <strong>QR code or barcode</strong><br/>
            <span className="text-xs opacity-75">Make sure code is well-lit and fills the green frame</span>
            {status && (
              <div className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                {status}
              </div>
            )}
            {error && (
              <div className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
          </div>

          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Scanning overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-4 border-2 border-green-500 rounded-lg">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-500 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-500 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-500 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-500 rounded-br-lg"></div>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button 
              variant="outline"
              onClick={() => handleScanResult("TEST-QR-12345")}
              className="flex-1"
              size="sm"
            >
              Test QR
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => handleScanResult("MANUAL-INPUT")}
              className="flex-1"
              size="sm"
            >
              <Type className="w-4 h-4 mr-2" />
              Manual
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