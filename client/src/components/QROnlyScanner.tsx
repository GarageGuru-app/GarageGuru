import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, Flashlight, FlashlightOff, Type, Bug, Camera } from "lucide-react";

interface QROnlyScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export function QROnlyScanner({ isOpen, onClose, onScan }: QROnlyScannerProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [cameraInfo, setCameraInfo] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanIntervalRef = useRef<number>();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLog(prev => [...prev.slice(-3), `${timestamp}: ${message}`]);
    console.log(`QR Scanner: ${message}`);
  };

  useEffect(() => {
    if (isOpen) {
      initializeScanner();
    } else {
      cleanup();
    }
    return () => cleanup();
  }, [isOpen]);

  const initializeScanner = async () => {
    try {
      setError("");
      setStatus("Initializing camera...");
      setDebugLog([]);
      addLog("Starting QR scanner initialization");

      // Get available cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      addLog(`Found ${videoDevices.length} camera(s)`);

      // Try to get back camera with high resolution
      const constraints = {
        video: {
          facingMode: { exact: "environment" },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 }
        }
      };

      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        addLog("Back camera acquired successfully");
      } catch (backCameraError) {
        addLog("Back camera failed, trying any camera");
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 1280 }, 
              height: { ideal: 720 } 
            } 
          });
          addLog("Front/any camera acquired");
        } catch (anyCameraError) {
          throw new Error("No camera available");
        }
      }

      if (!mediaStream) {
        throw new Error("Failed to get camera stream");
      }

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        videoRef.current.onloadedmetadata = () => {
          const video = videoRef.current;
          if (video) {
            const info = `${video.videoWidth}x${video.videoHeight}`;
            setCameraInfo(info);
            addLog(`Video ready: ${info}`);
            setStatus("Camera ready - scanning for QR codes");
            startQRScanning();
          }
        };
        
        await videoRef.current.play();
        addLog("Video element started playing");
      }

    } catch (err) {
      const errorMsg = `Camera initialization failed: ${err}`;
      setError(errorMsg);
      addLog(errorMsg);
    }
  };

  const cleanup = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = undefined;
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    setStatus("");
    setError("");
    setIsScanning(false);
    setDebugLog([]);
    setCameraInfo("");
  };

  const startQRScanning = () => {
    if (isScanning) return;
    setIsScanning(true);
    addLog("QR scanning started - 500ms intervals");

    scanIntervalRef.current = window.setInterval(async () => {
      if (videoRef.current && stream && videoRef.current.readyState >= 2) {
        await scanForQRCode();
      }
    }, 500);
  };

  const scanForQRCode = async () => {
    if (!videoRef.current || !stream) return;

    const video = videoRef.current;
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      addLog("Video dimensions not ready");
      return;
    }

    try {
      // Method 1: Direct video scan with qr-scanner
      const result1 = await tryDirectVideoScan(video);
      if (result1) return;

      // Method 2: Canvas processing with different enhancements
      const result2 = await tryCanvasProcessing(video);
      if (result2) return;

      // Method 3: Higher resolution canvas
      const result3 = await tryHighResCanvas(video);
      if (result3) return;

    } catch (err) {
      addLog(`Scan error: ${err}`);
    }
  };

  const tryDirectVideoScan = async (video: HTMLVideoElement) => {
    try {
      const QrScanner = await import('qr-scanner');
      const result = await QrScanner.default.scanImage(video);
      
      if (result && result.trim()) {
        addLog(`✅ Direct scan success: ${result.substring(0, 20)}...`);
        handleSuccess(result);
        return true;
      }
    } catch (err) {
      // Silent fail - this is expected when no QR code is visible
    }
    return false;
  };

  const tryCanvasProcessing = async (video: HTMLVideoElement) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Try different image processing filters
      const filters = [
        'contrast(150%) brightness(110%)',
        'contrast(200%) brightness(120%) saturate(0%)',  // Grayscale
        'contrast(300%) brightness(150%)'
      ];

      for (const filter of filters) {
        ctx.save();
        ctx.filter = filter;
        ctx.drawImage(video, 0, 0);
        ctx.restore();

        try {
          const QrScanner = await import('qr-scanner');
          const result = await QrScanner.default.scanImage(canvas);
          
          if (result && result.trim()) {
            addLog(`✅ Canvas scan success (${filter.split(' ')[0]}): ${result.substring(0, 20)}...`);
            handleSuccess(result);
            return true;
          }
        } catch (err) {
          // Continue to next filter
        }
      }
    } catch (err) {
      addLog(`Canvas processing failed: ${err}`);
    }
    return false;
  };

  const tryHighResCanvas = async (video: HTMLVideoElement) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      // 2x upscaling for better detection
      const scale = 2;
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;
      
      ctx.scale(scale, scale);
      ctx.filter = 'contrast(150%) brightness(110%)';
      ctx.drawImage(video, 0, 0);

      const QrScanner = await import('qr-scanner');
      const result = await QrScanner.default.scanImage(canvas);
      
      if (result && result.trim()) {
        addLog(`✅ High-res scan success: ${result.substring(0, 20)}...`);
        handleSuccess(result);
        return true;
      }
    } catch (err) {
      // Silent fail
    }
    return false;
  };

  const handleSuccess = (code: string) => {
    addLog(`🎯 QR Code detected: ${code}`);
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
          addLog(`Torch ${!torchEnabled ? 'enabled' : 'disabled'}`);
        } catch (err) {
          addLog("Torch control not supported");
        }
      } else {
        addLog("Torch not available on this device");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg mx-auto" aria-describedby="qr-scanner-description">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <QrCode className="w-5 h-5 text-blue-600" />
              <span>QR Code Scanner</span>
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
          <div id="qr-scanner-description" className="text-center text-sm text-muted-foreground">
            <div className="font-medium text-blue-600">QR Code Detection Active</div>
            <div className="text-xs opacity-75">Position QR code within the blue frame</div>
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
            
            {/* QR-specific scanning overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className={`absolute inset-6 border-2 border-blue-500 rounded-lg ${isScanning ? 'animate-pulse' : ''}`}>
                {/* QR code corner indicators */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br"></div>
                
                {/* Center QR indicator */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-blue-500 opacity-30" />
                </div>
              </div>
            </div>
          </div>

          {/* Debug information */}
          {debugLog.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-2 mb-2">
                <Bug className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Debug Log</span>
              </div>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {debugLog.map((log, index) => (
                  <div key={index} className="text-xs font-mono text-blue-700 dark:text-blue-300">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <Button 
              variant="outline"
              onClick={() => handleSuccess("TEST-QR-456")}
              className="flex-1"
              size="sm"
            >
              Test QR
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => handleSuccess("MANUAL-INPUT")}
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