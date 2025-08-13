import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Camera, Type, Flashlight } from "lucide-react";

interface WorkingScannerProps {
  onScan: (code: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function WorkingScanner({ onScan, isOpen, onClose }: WorkingScannerProps) {
  const [error, setError] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | (() => void) | null>(null);

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

      // Check HTTPS requirement
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        setError("Camera requires HTTPS. Please use a secure connection.");
        return;
      }

      // Get available video devices and prefer back camera
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      let deviceId;
      if (videoDevices.length > 1) {
        const backCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('environment')
        );
        if (backCamera) {
          deviceId = backCamera.deviceId;
        }
      }

      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          focusMode: "continuous",
          ...(deviceId && { deviceId: { exact: deviceId } })
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setStatus("Camera starting...");

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be truly ready
        const waitForVideoReady = () => {
          return new Promise<void>((resolve) => {
            const checkReady = () => {
              if (videoRef.current && 
                  videoRef.current.videoWidth > 0 && 
                  videoRef.current.videoHeight > 0) {
                resolve();
              } else {
                requestAnimationFrame(checkReady);
              }
            };
            checkReady();
          });
        };

        videoRef.current.addEventListener('loadeddata', async () => {
          await waitForVideoReady();
          setStatus("Camera ready - point at code");
          
          // Start detection after one more frame to avoid empty frames on iOS
          requestAnimationFrame(() => {
            startDetection();
          });
        });

        await videoRef.current.play();
      }

    } catch (err: any) {
      console.error("Camera error:", err);
      let errorMessage = "Camera access failed";
      
      if (err.name === "NotAllowedError") {
        errorMessage = "Camera permission denied. Please allow camera access and try again.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "No camera found on this device.";
      }
      
      setError(errorMessage);
      setStatus("");
    }
  };

  const startDetection = () => {
    if (!videoRef.current || !stream) return;
    
    setStatus("Scanning for codes...");
    
    // Start hybrid detection with debouncing
    const stopFn = startHybridDecode(
      videoRef.current,
      (result: string) => {
        console.log("Code detected:", result);
        setStatus("Code detected!");
        onScan(result);
        onClose();
      },
      (error: string) => {
        console.log("Detection error:", error);
      }
    );

    // Store stop function for cleanup
    scanIntervalRef.current = stopFn as any;

    // Show torch hint after 5 seconds without detection
    setTimeout(() => {
      if (stream && !torchEnabled) {
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        if (capabilities.torch) {
          setStatus("Low light? Try torch button →");
        }
      }
    }, 5000);
  };

  // Hybrid detection pipeline with proper debouncing
  const startHybridDecode = (
    videoEl: HTMLVideoElement,
    onResult: (result: string) => void,
    onError?: (error: string) => void
  ) => {
    let isRunning = true;
    let lastResult = '';
    let lastResultTime = 0;
    let animationId: number;
    let zxingInterval: NodeJS.Timeout;

    // Debounce results - ignore repeated reads within 1 second
    const debouncedResult = (result: string) => {
      const now = Date.now();
      if (result === lastResult && now - lastResultTime < 1000) {
        return; // Ignore duplicate
      }
      lastResult = result;
      lastResultTime = now;
      onResult(result);
    };

    // Path A: Native BarcodeDetector with requestAnimationFrame
    const tryBarcodeDetector = async () => {
      if (!isRunning || !('BarcodeDetector' in window)) return false;

      try {
        const detector = new (window as any).BarcodeDetector({
          formats: [
            'qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 
            'upc_a', 'upc_e', 'itf', 'codabar', 'data_matrix', 'pdf417'
          ]
        });
        
        const barcodes = await detector.detect(videoEl);
        if (barcodes.length > 0 && isRunning) {
          debouncedResult(barcodes[0].rawValue);
          return true;
        }
      } catch (err) {
        // BarcodeDetector failed, fall back
      }
      
      if (isRunning) {
        animationId = requestAnimationFrame(tryBarcodeDetector);
      }
      return false;
    };

    // Path B: ZXing with canvas and proper frame handling
    const tryZXing = async () => {
      if (!isRunning) return;

      try {
        const ZXing = await import('@zxing/browser');
        const reader = new ZXing.BrowserMultiFormatReader();
        
        // Create canvas with exact video dimensions (no CSS scaling)
        const canvas = document.createElement('canvas');
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
        const ctx = canvas.getContext('2d');
        
        const zxingLoop = async () => {
          if (!isRunning || !ctx) return;
          
          try {
            // Draw current frame to canvas (no mirroring)
            ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
            
            const result = await reader.decodeFromVideoElement(videoEl);
            if (result && isRunning) {
              debouncedResult(result.getText());
              return;
            }
          } catch (err: any) {
            // Ignore NotFound errors, log unexpected ones
            if (!err.message?.includes('NotFoundException') && !err.message?.includes('No MultiFormat')) {
              console.log('ZXing decode error:', err.message);
            }
          }
          
          // Continue loop with throttling
          if (isRunning) {
            setTimeout(zxingLoop, 400); // 400ms intervals
          }
        };
        
        zxingLoop();
        
      } catch (err) {
        onError?.('ZXing library failed');
        // Fall back to Path C
        tryQRScanner();
      }
    };

    // Path C: QR-scanner fallback (QR only)
    const tryQRScanner = async () => {
      if (!isRunning) return;

      try {
        const QrScanner = await import('qr-scanner');
        
        const qrLoop = async () => {
          if (!isRunning) return;
          
          try {
            const result = await QrScanner.default.scanImage(videoEl);
            
            if (result && isRunning) {
              debouncedResult(result);
              return;
            }
          } catch (err) {
            // Normal when no QR found
          }
          
          if (isRunning) {
            setTimeout(qrLoop, 500);
          }
        };
        
        qrLoop();
        
      } catch (err) {
        onError?.('All detection methods failed');
      }
    };

    // Start detection pipeline
    if ('BarcodeDetector' in window) {
      // Use native BarcodeDetector
      tryBarcodeDetector();
    } else {
      // Fall back to ZXing
      tryZXing();
    }

    // Return stop function
    return () => {
      isRunning = false;
      if (animationId) cancelAnimationFrame(animationId);
      if (zxingInterval) clearInterval(zxingInterval);
    };
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      // Call stop function if it's our hybrid detector
      if (typeof scanIntervalRef.current === 'function') {
        (scanIntervalRef.current as () => void)();
      } else {
        clearInterval(scanIntervalRef.current as NodeJS.Timeout);
      }
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
      
      // Only try to use torch if it's actually supported
      if ((capabilities as any).torch === true) {
        await track.applyConstraints({
          advanced: [{ torch: !torchEnabled } as any]
        });
        setTorchEnabled(!torchEnabled);
        setStatus(torchEnabled ? "Torch off" : "Torch on - scanning...");
      }
    } catch (err) {
      console.log("Torch not supported:", err);
      setStatus("Torch not available on this device");
    }
  };

  const handleManualInput = () => {
    const code = prompt("Enter QR code or barcode manually:");
    if (code && code.trim()) {
      onScan(code.trim());
      onClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
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
              style={{ transform: 'none' }} // Prevent any CSS scaling/distortion
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
                  className={`bg-black/50 text-white border-none ${
                    !(stream?.getVideoTracks()[0]?.getCapabilities() as any)?.torch ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={!(stream?.getVideoTracks()[0]?.getCapabilities() as any)?.torch}
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
          
          <div className="text-xs text-center text-muted-foreground">
            <strong>Tip:</strong> Hold steady and ensure good lighting for best results
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