import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Scan, Flashlight, FlashlightOff, Type, Bug } from "lucide-react";

interface UltimateScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export function UltimateScanner({ isOpen, onClose, onScan }: UltimateScannerProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanIntervalRef = useRef<number>();

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${info}`]);
  };

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
      addDebugInfo("Starting camera initialization");

      // Force mobile back camera
      const constraints = {
        video: {
          facingMode: { exact: "environment" },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 }
        }
      };

      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        addDebugInfo("Got back camera");
      } catch (err) {
        addDebugInfo("Back camera failed, trying any camera");
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        videoRef.current.onloadedmetadata = () => {
          addDebugInfo(`Video loaded: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`);
          setStatus("Camera ready - scanning active");
          startAggressiveScanning();
        };
        
        await videoRef.current.play();
      }
    } catch (err) {
      setError("Camera access failed");
      addDebugInfo(`Camera error: ${err}`);
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
    setDebugInfo([]);
  };

  const startAggressiveScanning = () => {
    if (isScanning) return;
    setIsScanning(true);
    addDebugInfo("Starting aggressive scanning mode");

    // Very fast scanning
    scanIntervalRef.current = window.setInterval(async () => {
      if (videoRef.current && stream && videoRef.current.readyState >= 2) {
        await attemptAllDetectionMethods();
      }
    }, 300); // Even faster - 300ms intervals
  };

  const attemptAllDetectionMethods = async () => {
    if (!videoRef.current || !stream) return;

    const video = videoRef.current;
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      addDebugInfo("Video not ready");
      return;
    }

    try {
      // Method 1: Direct qr-scanner on video element
      const result1 = await tryQRScannerDirect(video);
      if (result1) return;

      // Method 2: Multiple canvas processing with qr-scanner
      const result2 = await tryMultipleCanvasProcessing(video);
      if (result2) return;

      // Method 3: ZXing with multiple approaches
      const result3 = await tryZXingMultiple(video);
      if (result3) return;

      // Method 4: HTML5 QR Code library (if available)
      const result4 = await tryHTML5QRCode(video);
      if (result4) return;

    } catch (err) {
      addDebugInfo(`Detection error: ${err}`);
    }
  };

  const tryQRScannerDirect = async (video: HTMLVideoElement) => {
    try {
      const QrScanner = await import('qr-scanner');
      const result = await QrScanner.default.scanImage(video);
      
      if (result && result.trim()) {
        addDebugInfo(`✅ QR-Scanner Direct: ${result}`);
        handleScanResult(result);
        return true;
      }
    } catch (err) {
      addDebugInfo(`QR-Scanner Direct failed: ${err}`);
    }
    return false;
  };

  const tryMultipleCanvasProcessing = async (video: HTMLVideoElement) => {
    try {
      const QrScanner = await import('qr-scanner');
      
      // Try 5 different processing methods
      const methods = [
        { scale: 1, filter: 'none', name: 'Standard' },
        { scale: 2, filter: 'contrast(200%) brightness(120%)', name: 'High Contrast' },
        { scale: 1.5, filter: 'contrast(150%) saturate(0%)', name: 'Grayscale' },
        { scale: 3, filter: 'contrast(300%) brightness(150%)', name: 'Ultra Contrast' },
        { scale: 1, filter: 'brightness(150%) contrast(120%) saturate(150%)', name: 'Enhanced' }
      ];

      for (const { scale, filter, name } of methods) {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          canvas.width = video.videoWidth * scale;
          canvas.height = video.videoHeight * scale;
          
          ctx.save();
          ctx.scale(scale, scale);
          ctx.filter = filter;
          ctx.drawImage(video, 0, 0);
          ctx.restore();

          const result = await QrScanner.default.scanImage(canvas);
          
          if (result && result.trim()) {
            addDebugInfo(`✅ Canvas ${name}: ${result}`);
            handleScanResult(result);
            return true;
          }
        } catch (err) {
          // Continue to next method
        }
      }
    } catch (err) {
      addDebugInfo(`Canvas processing failed: ${err}`);
    }
    return false;
  };

  const tryZXingMultiple = async (video: HTMLVideoElement) => {
    try {
      const ZXing = await import('@zxing/browser');
      
      // Try multiple ZXing readers
      const readers = [
        new ZXing.BrowserMultiFormatReader(),
        new ZXing.BrowserQRCodeReader(),
        new ZXing.BrowserDataMatrixCodeReader()
      ];

      for (const reader of readers) {
        try {
          // Direct video scan
          const result = await reader.decodeOnceFromVideoElement(video);
          if (result && (result as any).getText) {
            addDebugInfo(`✅ ZXing: ${(result as any).getText()}`);
            handleScanResult((result as any).getText());
            return true;
          }
        } catch (err) {
          // Try canvas approach
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) continue;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const result = await reader.decodeFromImageData(imageData);
            
            if (result && (result as any).getText) {
              addDebugInfo(`✅ ZXing Canvas: ${(result as any).getText()}`);
              handleScanResult((result as any).getText());
              return true;
            }
          } catch (canvasErr) {
            // Continue
          }
        }
      }
    } catch (err) {
      addDebugInfo(`ZXing failed: ${err}`);
    }
    return false;
  };

  const tryHTML5QRCode = async (video: HTMLVideoElement) => {
    try {
      // Try html5-qrcode if available
      const Html5QrCode = await import('html5-qrcode').then(module => module.Html5Qrcode);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const dataURL = canvas.toDataURL('image/png');
      
      // This is a simplified approach - in practice, html5-qrcode needs more setup
      addDebugInfo("Attempted HTML5 QR Code");
      
    } catch (err) {
      addDebugInfo(`HTML5 QR Code failed: ${err}`);
    }
    return false;
  };

  const handleScanResult = (code: string) => {
    addDebugInfo(`🎯 SUCCESS: ${code}`);
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
          addDebugInfo(`Torch ${!torchEnabled ? 'ON' : 'OFF'}`);
        } catch (err) {
          addDebugInfo("Torch not supported");
        }
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg mx-auto" aria-describedby="ultimate-scanner-description">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Scan className="w-5 h-5" />
              <span>Ultimate Scanner</span>
            </DialogTitle>
            <div className="flex space-x-1">
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
          <div id="ultimate-scanner-description" className="text-center text-sm text-muted-foreground">
            <div className="font-medium">Multi-Engine Detection Active</div>
            <div className="text-xs opacity-75">Hold code steady in green frame</div>
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
            
            {/* Enhanced scanning overlay with pulsing effect */}
            <div className="absolute inset-0 pointer-events-none">
              <div className={`absolute inset-4 border-2 border-green-500 rounded-lg ${isScanning ? 'animate-pulse' : ''}`}>
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-lg"></div>
                
                {/* Scanning line animation */}
                {isScanning && (
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-500 animate-bounce"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Debug information */}
          {debugInfo.length > 0 && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Bug className="w-4 h-4" />
                <span className="text-sm font-medium">Debug Log</span>
              </div>
              <div className="space-y-1">
                {debugInfo.map((info, index) => (
                  <div key={index} className="text-xs font-mono text-gray-600 dark:text-gray-400">
                    {info}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <Button 
              variant="outline"
              onClick={() => handleScanResult("TEST-ULTIMATE-999")}
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
      </DialogContent>
    </Dialog>
  );
}