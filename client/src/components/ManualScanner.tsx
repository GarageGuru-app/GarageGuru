import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { X, QrCode, Type, Scan } from "lucide-react";

interface ManualScannerProps {
  onScan: (code: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ManualScanner({ onScan, isOpen, onClose }: ManualScannerProps) {
  const [inputCode, setInputCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      onScan(inputCode.trim());
      setInputCode("");
      onClose();
    }
  };

  const handleQuickScan = (sampleCode: string) => {
    onScan(sampleCode);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <QrCode className="w-5 h-5" />
              <span>Enter Code</span>
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            Enter any <strong>QR code</strong> or <strong>barcode</strong> manually
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Code or Barcode</label>
              <Input
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Enter code here..."
                className="w-full"
                autoFocus
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={!inputCode.trim()}>
              <Scan className="w-4 h-4 mr-2" />
              Process Code
            </Button>
          </form>
          
          <div className="border-t pt-4">
            <div className="text-xs text-center text-muted-foreground mb-3">
              Or try these sample codes to test the system:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickScan("BRAKE-PAD-001")}
                className="text-xs"
              >
                BRAKE-PAD-001
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickScan("ENGINE-OIL-5W30")}
                className="text-xs"
              >
                ENGINE-OIL-5W30
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickScan("SPARK-PLUG-NGK")}
                className="text-xs"
              >
                SPARK-PLUG-NGK
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickScan("AIR-FILTER-001")}
                className="text-xs"
              >
                AIR-FILTER-001
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-center text-muted-foreground">
            Camera scanning can be enabled later when browser compatibility is resolved
          </div>
          
          <Button 
            variant="secondary" 
            onClick={onClose}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}