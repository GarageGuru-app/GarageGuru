import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { BrowserQRCodeReader } from '@zxing/library';

export function useBarcodeScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    codeReaderRef.current = new BrowserQRCodeReader();
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async (onResult: (barcode: string) => void) => {
    try {
      setIsScanning(true);
      
      if (!codeReaderRef.current) {
        throw new Error("Code reader not initialized");
      }

      // Create modal backdrop
      const modalBackdrop = document.createElement("div");
      modalBackdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      `;

      // Create video element
      const video = document.createElement("video");
      video.style.cssText = `
        width: 90%;
        max-width: 400px;
        height: auto;
        border-radius: 8px;
        border: 2px solid #fff;
      `;
      
      // Create close button
      const closeButton = document.createElement("button");
      closeButton.textContent = "Close Scanner";
      closeButton.style.cssText = `
        margin-top: 20px;
        padding: 10px 20px;
        background: #fff;
        color: #000;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        cursor: pointer;
      `;

      // Create instructions text
      const instructions = document.createElement("div");
      instructions.textContent = "Point your camera at a barcode or QR code";
      instructions.style.cssText = `
        color: white;
        margin-bottom: 20px;
        text-align: center;
        font-size: 18px;
      `;

      modalBackdrop.appendChild(instructions);
      modalBackdrop.appendChild(video);
      modalBackdrop.appendChild(closeButton);
      document.body.appendChild(modalBackdrop);

      videoRef.current = video;

      const cleanup = () => {
        stopScanning();
        if (document.body.contains(modalBackdrop)) {
          document.body.removeChild(modalBackdrop);
        }
      };

      // Start scanning
      try {
        console.log("Starting barcode scan...");
        await codeReaderRef.current.decodeFromVideoDevice(null, video, (result, error) => {
          if (result) {
            console.log("Barcode detected:", result.getText());
            const scannedText = result.getText();
            onResult(scannedText);
            toast({
              title: "Barcode Scanned",
              description: `Found: ${scannedText}`,
            });
            cleanup();
          }
          if (error && error.name !== 'NotFoundException') {
            console.log("Scan error:", error);
          }
        });
        
        // Add manual input button for testing
        const manualButton = document.createElement("button");
        manualButton.textContent = "Enter Manually";
        manualButton.style.cssText = `
          margin-top: 10px;
          padding: 8px 16px;
          background: #666;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
        `;
        manualButton.onclick = () => {
          const barcode = prompt("Enter barcode manually:");
          if (barcode) {
            onResult(barcode);
            cleanup();
          }
        };
        modalBackdrop.appendChild(manualButton);
        
      } catch (scanError) {
        console.error("Scanning error:", scanError);
        // Fallback to manual input
        cleanup();
        const barcode = prompt("Camera scanning failed. Enter barcode manually:");
        if (barcode) {
          onResult(barcode);
        }
      }

      closeButton.onclick = cleanup;
      modalBackdrop.onclick = (e) => {
        if (e.target === modalBackdrop) cleanup();
      };

    } catch (error) {
      console.error("Camera access error:", error);
      toast({
        title: "Camera Error", 
        description: "Unable to access camera. Please enter barcode manually.",
        variant: "destructive",
      });
      
      // Fallback to manual input
      const barcode = prompt("Enter barcode manually:");
      if (barcode) {
        onResult(barcode);
      }
      
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    try {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    } catch (error) {
      console.error("Error stopping scanner:", error);
    }
    setIsScanning(false);
  };

  return {
    isScanning,
    startScanning,
    stopScanning,
  };
}
