import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Camera, Type, Flashlight } from "lucide-react";

interface CameraScannerProps {
  onScan: (code: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function CameraScanner({ onScan, isOpen, onClose }: CameraScannerProps) {
  const [error, setError] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      });

      setStream(mediaStream);
      setStatus("Camera ready");

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        
        // Start scanning after video is ready
        videoRef.current.addEventListener('loadedmetadata', () => {
          setStatus("Ready to scan");
          startScanning();
        });
      }

    } catch (err: any) {
      console.error("Camera error:", err);
      let errorMessage = "Camera access failed";
      
      if (err.name === "NotAllowedError") {
        errorMessage = "Camera permission denied. Please allow camera access and try again.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "No camera found on this device.";
      } else if (err.message.includes("Permission denied")) {
        errorMessage = "Camera permission denied. Please check browser settings.";
      }
      
      setError(errorMessage);
      setStatus("");
    }
  };

  const startScanning = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setScanning(true);
    setStatus("Scanning for codes...");

    // Start continuous scanning with canvas analysis
    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        analyzeVideoFrame();
      }
    }, 500); // Check every 500ms

    // Also try qr-scanner library
    import('qr-scanner').then((QrScanner) => {
      const scanner = new QrScanner.default(
        videoRef.current!,
        (result) => {
          console.log("QR Scanner detected:", result.data);
          setStatus("Code detected!");
          onScan(result.data);
          onClose();
        },
        {
          highlightScanRegion: false,
          highlightCodeOutline: false,
          maxScansPerSecond: 2,
        }
      );
      
      scanner.start().then(() => {
        console.log("QR Scanner started");
        setStatus("Ready - point at QR code or barcode");
      }).catch(err => {
        console.log("QR scanner failed, using canvas method");
      });

    }).catch(err => {
      console.log("QR scanner library not available, using canvas method");
    });
  };

  const analyzeVideoFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || video.readyState !== 4) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Try to detect codes using ZXing library
    import('@zxing/library').then(({ BrowserMultiFormatReader }) => {
      const codeReader = new BrowserMultiFormatReader();
      
      codeReader.decodeFromCanvas(canvas).then(result => {
        console.log("ZXing detected:", result.getText());
        setStatus("Code detected!");
        onScan(result.getText());
        onClose();
      }).catch(err => {
        // Normal when no code is found, don't log
      });
    }).catch(err => {
      // ZXing not available
    });
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

    setScanning(false);
    setStatus("");
  };

  const toggleTorch = async () => {
    if (!stream) return;
    
    try {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      
      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !torchEnabled }]
        });
        setTorchEnabled(!torchEnabled);
      }
    } catch (err) {
      console.log("Torch not supported:", err);
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
            />
            
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ display: 'none' }}
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