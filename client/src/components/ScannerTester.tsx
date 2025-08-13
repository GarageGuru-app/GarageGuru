import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ScannerTester() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testNativeBarcodeDetector = async () => {
    try {
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13']
        });
        addResult("✅ Native BarcodeDetector is available");
        
        // Test with a sample canvas
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, 100, 100);
          
          const result = await detector.detect(canvas);
          addResult(`Native detector test: ${result.length} codes found`);
        }
      } else {
        addResult("❌ Native BarcodeDetector not available");
      }
    } catch (err) {
      addResult(`❌ Native BarcodeDetector error: ${err}`);
    }
  };

  const testQRScanner = async () => {
    try {
      const QrScanner = await import('qr-scanner');
      addResult("✅ qr-scanner library loaded successfully");
      
      // Test if scanImage method is available
      if (typeof QrScanner.default.scanImage === 'function') {
        addResult("✅ QrScanner.scanImage method is available");
      } else {
        addResult("❌ QrScanner.scanImage method not found");
      }
    } catch (err) {
      addResult(`❌ qr-scanner error: ${err}`);
    }
  };

  const testZXing = async () => {
    try {
      const ZXing = await import('@zxing/browser');
      const reader = new ZXing.BrowserMultiFormatReader();
      addResult("✅ ZXing library loaded successfully");
      
      if (typeof reader.decodeFromImageElement === 'function') {
        addResult("✅ ZXing.decodeFromImageElement method is available");
      } else {
        addResult("❌ ZXing.decodeFromImageElement method not found");
      }
    } catch (err) {
      addResult(`❌ ZXing error: ${err}`);
    }
  };

  const testCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      addResult("✅ Camera access granted");
      
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      
      addResult(`Camera dimensions: ${video.videoWidth}x${video.videoHeight}`);
      
      // Clean up
      stream.getTracks().forEach(track => track.stop());
      
    } catch (err) {
      addResult(`❌ Camera error: ${err}`);
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    addResult("🧪 Starting scanner compatibility tests...");
    
    await testCamera();
    await testNativeBarcodeDetector();
    await testQRScanner();
    await testZXing();
    
    addResult("✅ All tests completed");
  };

  return (
    <Card className="max-w-md mx-auto m-4">
      <CardHeader>
        <CardTitle>Scanner Diagnostics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runAllTests} className="w-full">
          Run Scanner Tests
        </Button>
        
        <div className="space-y-2">
          <div className="flex space-x-2">
            <Button size="sm" onClick={testCamera}>Camera</Button>
            <Button size="sm" onClick={testNativeBarcodeDetector}>Native</Button>
            <Button size="sm" onClick={testQRScanner}>QR-Scanner</Button>
            <Button size="sm" onClick={testZXing}>ZXing</Button>
          </div>
        </div>
        
        {testResults.length > 0 && (
          <div className="bg-muted p-3 rounded text-xs space-y-1 max-h-60 overflow-y-auto">
            {testResults.map((result, i) => (
              <div key={i} className="font-mono">{result}</div>
            ))}
          </div>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setTestResults([])}
          className="w-full"
        >
          Clear Results
        </Button>
      </CardContent>
    </Card>
  );
}