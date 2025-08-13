import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, Flashlight, FlashlightOff, Type, Camera, CheckCircle } from "lucide-react";
import { startCameraStream, startHybridDecode } from "@/utils/hybridScanner";

interface HybridScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export function HybridScanner({ isOpen, onClose, onScan }: HybridScannerProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraInfo, setCameraInfo] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const stopScanRef = useRef<(() => void) | null>(null);



  useEffect(() => {
    if (isOpen) {
      initializeHybridScanner();
    } else {
      cleanup();
    }
    return () => cleanup();
  }, [isOpen]);

  const initializeHybridScanner = async () => {
    try {
      setError("");
      setStatus("Starting camera...");

      // Start camera
      const { stream: mediaStream, track } = await startCameraStream();
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        videoRef.current.onloadedmetadata = async () => {
          const video = videoRef.current;
          if (video) {
            const info = `${video.videoWidth}x${video.videoHeight}`;
            setCameraInfo(info);
            setStatus("Scanning active - hold code steady");
            setIsScanning(true);
            
            // Start hybrid detection
            try {
              const stopFn = await startHybridDecode(
                video,
                (result) => {
                  handleSuccess(result.text, result.format);
                },
                (err) => {
                  // Silent error handling
                }
              );
              stopScanRef.current = stopFn;
            } catch (err) {
              setError("Detection initialization failed");
            }
          }
        };
        
        await videoRef.current.play();
      }

    } catch (err) {
      setError("Camera access denied or unavailable");
    }
  };

  const cleanup = () => {
    if (stopScanRef.current) {
      stopScanRef.current();
      stopScanRef.current = null;
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    setStatus("");
    setError("");
    setIsScanning(false);
    setCameraInfo("");
  };

  const handleSuccess = (code: string, format: string) => {
    cleanup();
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
          // Silent fail
        }
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg mx-auto" aria-describedby="hybrid-scanner-description">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <QrCode className="w-5 h-5 text-purple-600" />
              <span>Hybrid Scanner</span>
            </DialogTitle>
            <div className="flex items-center space-x-2">
              {cameraInfo && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Camera className="w-3 h-3" />
                  <span>{cameraInfo}</span>
                </div>
              )}
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
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div id="hybrid-scanner-description" className="text-center text-sm text-muted-foreground">
            <div className="font-medium text-purple-600">Scan QR Code or Barcode</div>
            <div className="text-xs opacity-75">Position code within the frame</div>
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
            
            {/* Hybrid scanning overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className={`absolute inset-6 border-2 border-purple-500 rounded-lg ${isScanning ? 'animate-pulse' : ''}`}>
                {/* Corner indicators */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-purple-500 rounded-tl"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-purple-500 rounded-tr"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-purple-500 rounded-bl"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-purple-500 rounded-br"></div>
                
                {/* Center indicator */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {isScanning ? (
                    <QrCode className="w-8 h-8 text-purple-500 opacity-30 animate-bounce" />
                  ) : (
                    <CheckCircle className="w-8 h-8 text-purple-500 opacity-30" />
                  )}
                </div>
              </div>
            </div>
          </div>



          <div className="flex space-x-2">
            <Button 
              variant="outline"
              onClick={() => handleSuccess("TEST-HYBRID-123", "QR_CODE")}
              className="flex-1"
              size="sm"
            >
              Test
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => handleSuccess("MANUAL-INPUT", "MANUAL")}
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
      </DialogContent>
    </Dialog>
  );
}