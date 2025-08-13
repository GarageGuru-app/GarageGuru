import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Scan, Flashlight, FlashlightOff, Type } from "lucide-react";

interface ReliableScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export function ReliableScanner({ isOpen, onClose, onScan }: ReliableScannerProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanIntervalRef = useRef<number>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

      // Try different camera configurations
      const constraints = [
        { // High quality back camera
          video: {
            facingMode: { exact: "environment" },
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 }
          }
        },
        { // Fallback configuration
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        },
        { // Any camera
          video: true
        }
      ];

      let mediaStream = null;
      for (const constraint of constraints) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(constraint);
          break;
        } catch (err) {
          console.log("Camera constraint failed:", constraint, err);
        }
      }

      if (!mediaStream) {
        throw new Error("No camera available");
      }

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        
        videoRef.current.addEventListener('loadedmetadata', () => {
          console.log("Camera ready:", videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight);
          setStatus("Camera ready - hold steady over code");
          startScanning();
        });
        
        if (videoRef.current.readyState >= 2) {
          console.log("Camera already loaded:", videoRef.current.videoWidth, "x", videoRef.current.videoHeight);
          setStatus("Camera ready - hold steady over code");
          startScanning();
        }
      }
    } catch (err) {
      setError("Camera not available. Please allow camera access and try again.");
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
    setIsScanning(false);
  };

  const startScanning = () => {
    if (isScanning) return;
    setIsScanning(true);
    console.log("Starting reliable scanning...");

    scanIntervalRef.current = window.setInterval(async () => {
      if (videoRef.current && stream && videoRef.current.readyState >= 2) {
        await detectCode();
      }
    }, 500); // Fast scanning
  };

  const detectCode = async () => {
    if (!videoRef.current || !stream) return;

    const video = videoRef.current;
    
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    try {
      // Create multiple canvas captures with different processing
      await Promise.all([
        tryQRScannerDirect(video),
        tryQRScannerCanvas(video),
        tryZXingDetection(video)
      ]);

    } catch (err) {
      console.log("Detection batch error:", err);
    }
  };

  const tryQRScannerDirect = async (video: HTMLVideoElement) => {
    try {
      const QrScanner = await import('qr-scanner');
      const result = await QrScanner.default.scanImage(video);
      
      if (result && result.trim()) {
        console.log("✅ QR-Scanner Direct:", result);
        handleScanResult(result);
        return true;
      }
    } catch (err) {
      // Silent fail
    }
    return false;
  };

  const tryQRScannerCanvas = async (video: HTMLVideoElement) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      // Multiple canvas processing attempts
      const processings = [
        { scale: 1, filter: 'none' },
        { scale: 2, filter: 'contrast(200%) brightness(120%)' },
        { scale: 1.5, filter: 'contrast(150%) brightness(110%) saturate(0%)' } // Grayscale
      ];

      for (const { scale, filter } of processings) {
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;
        
        ctx.save();
        ctx.scale(scale, scale);
        ctx.filter = filter;
        ctx.drawImage(video, 0, 0);
        ctx.restore();

        try {
          const QrScanner = await import('qr-scanner');
          const result = await QrScanner.default.scanImage(canvas);
          
          if (result && result.trim()) {
            console.log(`✅ QR-Scanner Canvas (${scale}x, ${filter}):`, result);
            handleScanResult(result);
            return true;
          }
        } catch (err) {
          // Continue to next processing
        }
      }
    } catch (err) {
      // Silent fail
    }
    return false;
  };

  const tryZXingDetection = async (video: HTMLVideoElement) => {
    try {
      const ZXing = await import('@zxing/browser');
      const reader = new ZXing.BrowserMultiFormatReader();
      
      // Try multiple ZXing approaches
      try {
        const result = await reader.decodeOnceFromVideoElement(video);
        if (result && (result as any).getText) {
          console.log("✅ ZXing Direct:", (result as any).getText());
          handleScanResult((result as any).getText());
          return true;
        }
      } catch (err) {
        // Try canvas approach
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return false;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const dataURL = canvas.toDataURL('image/png');
        const img = new Image();
        img.src = dataURL;
        await new Promise(resolve => img.onload = resolve);
        
        const result = await reader.decodeFromImageElement(img);
        if (result && (result as any).getText) {
          console.log("✅ ZXing Canvas:", (result as any).getText());
          handleScanResult((result as any).getText());
          return true;
        }
      }
    } catch (err) {
      // Silent fail
    }
    return false;
  };

  const handleScanResult = (code: string) => {
    console.log("🎯 Scan successful:", code);
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
      <DialogContent className="max-w-md mx-auto" aria-describedby="reliable-scanner-description">
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
          <div id="reliable-scanner-description" className="text-center text-sm text-muted-foreground">
            Hold steady - scanning with multiple engines<br/>
            <span className="text-xs opacity-75">Position code clearly within the green frame</span>
            {status && (
              <div className="mt-1 text-xs font-medium text-green-600 dark:text-green-400">
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
            
            {/* Enhanced scanning overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-4 border-2 border-green-500 rounded-lg">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-lg"></div>
                
                {/* Center crosshair */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-green-500 rounded-full bg-green-500 bg-opacity-20"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button 
              variant="outline"
              onClick={() => handleScanResult("TEST-CODE-789")}
              className="flex-1"
              size="sm"
            >
              Test
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
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </DialogContent>
    </Dialog>
  );
}