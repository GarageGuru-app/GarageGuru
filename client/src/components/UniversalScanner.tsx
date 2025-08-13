import { useState, useEffect, useRef } from "react";
import QrScanner from "qr-scanner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Camera, Type, RotateCw } from "lucide-react";

interface UniversalScannerProps {
  onScan: (code: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function UniversalScanner({ onScan, isOpen, onClose }: UniversalScannerProps) {
  const [error, setError] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<QrScanner.Camera[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [detectedFormat, setDetectedFormat] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      initializeScanner();
    }
    
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    // Get available cameras
    QrScanner.listCameras(true).then(cams => {
      setCameras(cams);
      console.log("Available cameras:", cams);
    }).catch(err => {
      console.error("Failed to list cameras:", err);
    });
  }, []);

  const initializeScanner = async () => {
    if (!videoRef.current || scannerRef.current) return;

    try {
      setError("");
      setIsScanning(false);
      setDetectedFormat("Initializing...");

      console.log("Starting camera initialization...");

      // Check if camera permissions are available
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log("MediaDevices API available");
      } else {
        throw new Error("Camera API not available in this browser");
      }

      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          console.log("Code detected:", result.data);
          setDetectedFormat("Code Detected!");
          onScan(result.data);
          onClose();
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: cameras[currentCameraIndex]?.id || 'environment',
          maxScansPerSecond: 3,
          returnDetailedScanResult: false,
        }
      );

      scannerRef.current = scanner;
      
      console.log("Starting scanner...");
      await scanner.start();
      
      console.log("Scanner started successfully");
      setIsScanning(true);
      setDetectedFormat("Camera Ready");
      
    } catch (err: any) {
      console.error("Scanner initialization failed:", err);
      let errorMessage = "Camera access failed";
      
      if (err.name === "NotAllowedError") {
        errorMessage = "Camera permission denied. Please allow camera access and try again.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "No camera found. Please ensure your device has a camera.";
      } else if (err.name === "NotSupportedError") {
        errorMessage = "Camera not supported in this browser.";
      } else {
        errorMessage = `Camera error: ${err.message}`;
      }
      
      setError(errorMessage);
      setIsScanning(false);
      setDetectedFormat("");
    }
  };

  const switchCamera = async () => {
    if (!scannerRef.current || cameras.length <= 1) return;

    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);

    try {
      await scannerRef.current.setCamera(cameras[nextIndex].id);
      console.log("Switched to camera:", cameras[nextIndex].label);
    } catch (err) {
      console.error("Failed to switch camera:", err);
    }
  };

  const handleManualInput = () => {
    const code = prompt("Enter QR code or barcode data manually:");
    if (code && code.trim()) {
      onScan(code.trim());
      onClose();
    }
  };

  const handleRetry = () => {
    setError("");
    setDetectedFormat("");
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    initializeScanner();
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
            <br />
            {isScanning ? "Camera active - scanning..." : "Initializing camera..."}
            {detectedFormat && (
              <div className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                Status: {detectedFormat}
              </div>
            )}
          </div>
          
          <div className="relative border-2 border-dashed border-primary/30 rounded-lg overflow-hidden aspect-square bg-black">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              style={{ display: isOpen ? 'block' : 'none' }}
            />
            
            {/* Scanning overlay */}
            {isScanning && (
              <div className="absolute inset-4 border-2 border-primary rounded-lg animate-pulse" />
            )}
            
            {/* Camera switch button */}
            {cameras.length > 1 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={switchCamera}
                className="absolute top-2 right-2"
                title="Switch camera"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          {error && (
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          )}
          
          <div className="text-xs text-center text-muted-foreground">
            Supports: QR codes, Code 128, Code 39, EAN, UPC, and more formats
            <br />
            <strong>Note:</strong> Please allow camera permission when prompted
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