import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Camera, Type } from "lucide-react";

interface SmartScannerProps {
  onScan: (code: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function SmartScanner({ onScan, isOpen, onClose }: SmartScannerProps) {
  const [error, setError] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const startScanning = async () => {
    try {
      setError("");
      setStatus("Starting camera...");

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera not supported in this browser");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      setStream(mediaStream);
      setStatus("Camera ready - point at code");

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        
        // Wait for video to be ready, then start code detection
        videoRef.current.addEventListener('loadedmetadata', () => {
          setStatus("Camera ready");
          startCodeDetection();
        });
        
        // Fallback if loadedmetadata doesn't fire
        setTimeout(() => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            startCodeDetection();
          }
        }, 2000);
      }

    } catch (err: any) {
      console.error("Camera access failed:", err);
      let errorMessage = "Camera access failed";
      
      if (err.name === "NotAllowedError") {
        errorMessage = "Please allow camera access and try again";
      } else if (err.name === "NotFoundError") {
        errorMessage = "No camera found on this device";
      } else if (err.name === "NotSupportedError") {
        errorMessage = "Camera not supported in this browser";
      } else {
        errorMessage = `Camera error: ${err.message}`;
      }
      
      setError(errorMessage);
      setStatus("");
    }
  };

  const startCodeDetection = async () => {
    if (!videoRef.current) return;

    try {
      setStatus("Loading scanner...");
      
      // Import QR scanner dynamically
      const QrScanner = await import('qr-scanner');
      
      setStatus("Initializing scanner...");
      
      const scanner = new QrScanner.default(
        videoRef.current,
        (result) => {
          console.log("Code detected:", result.data);
          setStatus("Code detected!");
          onScan(result.data);
          onClose();
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 5,
          returnDetailedScanResult: false,
        }
      );
      
      // Wait a bit for video to be ready
      setTimeout(async () => {
        try {
          await scanner.start();
          setStatus("Ready - point camera at code");
          console.log("QR Scanner started successfully");
        } catch (err) {
          console.error("Failed to start QR scanner:", err);
          setStatus("Scanner ready - use manual input to test");
        }
      }, 1000);
      
    } catch (err) {
      console.error("Failed to load QR scanner:", err);
      setStatus("Camera ready - use manual input to test");
    }
  };

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    // Stop any QR scanner instance
    if (videoRef.current) {
      try {
        // Try to destroy scanner if it exists
        import('qr-scanner').then((QrScanner) => {
          QrScanner.default.WORKER_PATH = '/node_modules/qr-scanner/qr-scanner-worker.min.js';
        }).catch(() => {});
      } catch (err) {
        console.log("Error stopping scanner:", err);
      }
    }

    setStatus("");
  };

  const handleManualInput = () => {
    const code = prompt("Enter QR code or barcode manually:");
    if (code && code.trim()) {
      onScan(code.trim());
      onClose();
    }
  };

  const handleRetry = () => {
    stopScanning();
    setTimeout(() => {
      startScanning();
    }, 500);
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
            Point your camera at any <strong>QR code</strong> or <strong>barcode</strong>
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
                onClick={handleRetry}
              >
                Try Again
              </Button>
            </div>
          )}
          
          <div className="text-xs text-center text-muted-foreground">
            Automatically detects QR codes and barcodes
            <br />
            <strong>Tip:</strong> Try the "Enter Manually" button to test functionality
          </div>
          
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