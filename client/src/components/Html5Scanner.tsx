import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Camera, Type } from "lucide-react";

interface Html5ScannerProps {
  onScan: (code: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Html5Scanner({ onScan, isOpen, onClose }: Html5ScannerProps) {
  const [error, setError] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && elementRef.current) {
      initializeScanner();
    }

    return () => {
      cleanupScanner();
    };
  }, [isOpen]);

  const initializeScanner = async () => {
    if (!elementRef.current || scannerRef.current) return;

    try {
      setError("");
      setIsScanning(true);

      console.log("Checking camera permissions...");

      // Check if we're on HTTPS or localhost (required for camera access)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        throw new Error("Camera requires HTTPS or localhost. Please use a secure connection.");
      }

      // Check camera permissions first
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported in this browser. Try Chrome, Firefox, or Safari.");
      }

      // Test camera access
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // Stop the test stream
        console.log("Camera access confirmed");
      } catch (permErr: any) {
        let message = "Camera access denied";
        if (permErr.name === "NotAllowedError") {
          message = "Please allow camera access in your browser settings and refresh the page";
        } else if (permErr.name === "NotFoundError") {
          message = "No camera found on this device";
        } else if (permErr.name === "NotSupportedError") {
          message = "Camera not supported on this device";
        }
        throw new Error(message);
      }

      console.log("Initializing HTML5 QR Code Scanner...");

      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: [0, 1], // QR_CODE and BARCODE
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          },
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          aspectRatio: 1.0,
        },
        false
      );

      scanner.render(
        (decodedText, decodedResult) => {
          console.log("Code detected:", decodedText, decodedResult);
          onScan(decodedText);
          onClose();
        },
        (error) => {
          // This fires frequently when no code is detected, so we don't log it
          if (error && !error.includes("NotFoundException") && !error.includes("No MultiFormat Readers")) {
            console.error("Scan error:", error);
          }
        }
      );

      scannerRef.current = scanner;
      setIsScanning(true);

    } catch (err: any) {
      console.error("Scanner initialization failed:", err);
      setError(err.message || "Scanner failed to start");
      setIsScanning(false);
    }
  };

  const cleanupScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.error("Error cleaning up scanner:", err);
      }
    }
    setIsScanning(false);
  };

  const handleManualInput = () => {
    const code = prompt("Enter QR code or barcode manually:");
    if (code && code.trim()) {
      onScan(code.trim());
      onClose();
    }
  };

  const handleRetry = () => {
    cleanupScanner();
    setTimeout(() => {
      initializeScanner();
    }, 500);
  };

  const handleClose = () => {
    cleanupScanner();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg mx-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Camera className="w-5 h-5" />
              <span>Scan Code</span>
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            Point your camera at any <strong>QR code</strong> or <strong>barcode</strong>
            {!isScanning && !error && (
              <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                Make sure to allow camera access when prompted
              </div>
            )}
          </div>
          
          <div className="border rounded-lg overflow-hidden bg-black min-h-[300px]">
            <div id="qr-reader" ref={elementRef} className="w-full"></div>
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
            Supports QR codes and various barcode formats (EAN, Code 128, etc.)
            <br />
            <strong>Note:</strong> Camera requires HTTPS or localhost access
            <br />
            <strong>Tip:</strong> Use "Enter Manually" to test the scanning workflow
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
              onClick={handleClose}
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