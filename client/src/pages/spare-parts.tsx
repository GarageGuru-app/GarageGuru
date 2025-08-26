import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Search,
  Plus,
  Edit,
  Trash2,
  TriangleAlert,
  QrCode,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

import { QRScanner } from "@/components/QRScanner";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { HybridScanner } from "@/components/HybridScanner";

interface SparePartForm {
  partNumber: string;
  name: string;
  price: string;
  costPrice: string;
  quantity: string;
  lowStockThreshold: string;
  barcode: string;
}

export default function SpareParts() {
  const [, navigate] = useLocation();
  const { garage, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check if user is staff - restrict delete functionality
  const isStaff = user?.role === 'mechanic_staff';

  const [searchTerm, setSearchTerm] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<any>(null);
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [duplicatePart, setDuplicatePart] = useState<any>(null);
  const [lastScannedCode, setLastScannedCode] = useState("");
  const [scanCount, setScanCount] = useState(0);
  const [accumulatedQuantity, setAccumulatedQuantity] = useState(1);
  const [showRepeatScanDialog, setShowRepeatScanDialog] = useState(false);
  const [pendingScannedCode, setPendingScannedCode] = useState("");
  const [repeatScanPart, setRepeatScanPart] = useState<any>(null);

  // Enhanced scan constants and utilities
  const SCAN_DEBOUNCE_MS = 700;
  const SAME_CODE_WINDOW_MS = 8000; // how long to treat repeated scans as "same code"
  const lastScanAtRef = useRef(0);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showHybridScanner, setShowHybridScanner] = useState(false);
  const [formData, setFormData] = useState<SparePartForm>({
    partNumber: "",
    name: "",
    price: "",
    costPrice: "0",
    quantity: "",
    lowStockThreshold: "2",
    barcode: "",
  });

  const { data: spareParts = [], isLoading } = useQuery({
    queryKey: ["/api/garages", garage?.id, "spare-parts"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest(
        "GET",
        `/api/garages/${garage.id}/spare-parts`,
      );
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const { data: lowStockParts = [] } = useQuery({
    queryKey: ["/api/garages", garage?.id, "spare-parts", "low-stock"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest(
        "GET",
        `/api/garages/${garage.id}/spare-parts/low-stock`,
      );
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const createPartMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!garage?.id) throw new Error("No garage selected");
      const response = await apiRequest(
        "POST",
        `/api/garages/${garage.id}/spare-parts`,
        data,
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Spare part created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/garages", garage?.id] });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create spare part",
        variant: "destructive",
      });
    },
  });

  const updatePartMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      if (!garage?.id) throw new Error("No garage selected");
      const response = await apiRequest(
        "PUT",
        `/api/garages/${garage.id}/spare-parts/${id}`,
        data,
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update spare part");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Spare part updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/garages", garage?.id] });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update spare part",
        variant: "destructive",
      });
    },
  });

  const deletePartMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!garage?.id) throw new Error("No garage selected");
      const response = await apiRequest(
        "DELETE",
        `/api/garages/${garage.id}/spare-parts/${id}`,
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Spare part deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/garages", garage?.id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete spare part",
        variant: "destructive",
      });
    },
  });

  const filteredParts = spareParts.filter((part: any) => {
    const matchesSearch =
      part.name?.toLowerCase?.()?.includes(searchTerm.toLowerCase()) ||
      part.partNumber?.toLowerCase?.()?.includes(searchTerm.toLowerCase());

    if (showLowStockOnly) {
      return matchesSearch && part.quantity <= part.lowStockThreshold;
    }

    return matchesSearch;
  });

  const resetForm = () => {
    setFormData({
      partNumber: "",
      name: "",
      price: "",
      costPrice: "0",
      quantity: "",
      lowStockThreshold: "2",
      barcode: "",
    });
    setEditingPart(null);
    setIsDialogOpen(false);
    // Don't reset scan state here - preserve lastScannedCode for repeat detection
  };

  const handleEdit = (part: any) => {
    setEditingPart(part);
    setFormData({
      partNumber: part.partNumber,
      name: part.name,
      price: part.price.toString(),
      costPrice: part.costPrice?.toString() || "0",
      quantity: part.quantity.toString(),
      lowStockThreshold: part.lowStockThreshold.toString(),
      barcode: part.barcode || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check for duplicate part number when creating new part
    if (!editingPart) {
      const existingPart = spareParts.find(
        (part: any) =>
          part.partNumber?.toLowerCase?.() === formData.partNumber?.toLowerCase?.(),
      );

      if (existingPart) {
        setDuplicatePart(existingPart);
        setShowDuplicateAlert(true);
        return;
      }
    }

    const data = {
      partNumber: formData.partNumber,
      name: formData.name,
      price: formData.price,
      costPrice: formData.costPrice,
      quantity: parseInt(formData.quantity),
      lowStockThreshold: parseInt(formData.lowStockThreshold),
      barcode: formData.barcode || null,
    };

    if (editingPart) {
      updatePartMutation.mutate({ id: editingPart.id, data });
    } else {
      createPartMutation.mutate(data);
    }
  };

  const handleIncreaseQuantity = () => {
    if (!duplicatePart) return;

    // Use accumulated quantity for repeated scans
    const quantityToAdd =
      scanCount > 0 ? accumulatedQuantity : parseInt(formData.quantity);
    const newQuantity = duplicatePart.quantity + quantityToAdd;
    const updateData = {
      ...duplicatePart,
      quantity: newQuantity,
    };

    updatePartMutation.mutate({
      id: duplicatePart.id,
      data: updateData,
    });

    setShowDuplicateAlert(false);
    setDuplicatePart(null);
    setScanCount(0);
    setLastScannedCode("");
    setAccumulatedQuantity(1);
    resetForm();

    const message =
      scanCount > 0
        ? `Same code scanned ${scanCount + 1} times! Added total ${quantityToAdd} units to ${duplicatePart.name}. New total: ${newQuantity}`
        : `Increased quantity of ${duplicatePart.name} from ${duplicatePart.quantity} to ${newQuantity}`;

    toast({
      title: scanCount > 0 ? "Quantity Increased Again!" : "Quantity Updated",
      description: message,
    });
  };

  const handleConfirmRepeatScan = () => {
    if (repeatScanPart) {
      // Increase quantity by 1 for each confirmed scan
      const newQuantity = repeatScanPart.quantity + 1;
      const updateData = {
        ...repeatScanPart,
        quantity: newQuantity,
      };

      updatePartMutation.mutate({
        id: repeatScanPart.id,
        data: updateData,
      });

      // Don't update local state here - let the mutation refresh the data

      toast({
        title: "Stock Updated!",
        description: `Added 1 unit to ${repeatScanPart.name}. New total: ${newQuantity}`,
      });
    } else {
      // For unknown codes, process normally
      if (pendingScannedCode) {
        // Process the pending scan normally as a new scan
        handleQuickScan(pendingScannedCode);
      }
    }

    // Close dialog and continue scanning (keep scan state for continuous scanning)
    setShowRepeatScanDialog(false);
    setRepeatScanPart(null);
    setPendingScannedCode("");

    // Keep the scan count and last scanned code so next scan of same code will be detected
  };

  const handleDenyRepeatScan = () => {
    // Close dialog and continue scanning without changes
    setShowRepeatScanDialog(false);
    setRepeatScanPart(null);
    setPendingScannedCode("");

    // Keep scan state so user can scan same code again if needed

    toast({
      title: "Scan Ignored",
      description: "Ready to scan again",
      variant: "default",
    });
  };

  const resetScanState = () => {
    setScanCount(0);
    setLastScannedCode("");
    setAccumulatedQuantity(1);
    setPendingScannedCode("");
  };



  // normalize any raw scan text (trims, strips spaces around, uppercases bike-like codes)
  const normalizeCode = (s: string) => s.trim();

  // find a part by scanned code (matches partNumber or barcode)
  const findPartByCode = (code: string, list: any[]) =>
    list.find((p: any) => p.partNumber === code || p.barcode === code);

  const parseScannedCode = (scannedCode: string) => {
    // Parse quantity and selling price from scanned code
    // Format: PARTNUM-QTY@PRICE or PARTNUM-QTY_PRICE
    let partNumber = scannedCode.trim();
    let quantity = "";
    let sellingPrice = "";

    // First, check for quantity using dash separator
    if (scannedCode.includes("-")) {
      const dashParts = scannedCode.split("-");
      if (dashParts.length >= 2) {
        const basePartNumber = dashParts[0].trim();
        const remainingPart = dashParts.slice(1).join("-"); // Handle multiple dashes

        // Check if there's a price separator after the dash
        let quantityAndPrice = remainingPart;

        if (remainingPart.includes("@")) {
          const priceParts = remainingPart.split("@");
          quantityAndPrice = priceParts[0].trim();
          sellingPrice = priceParts[1]?.trim() || "";
        } else if (remainingPart.includes("_")) {
          const priceParts = remainingPart.split("_");
          quantityAndPrice = priceParts[0].trim();
          sellingPrice = priceParts[1]?.trim() || "";
        }

        // Extract quantity (should be numeric)
        const quantityMatch = quantityAndPrice.match(/^\d+/);
        if (quantityMatch) {
          quantity = quantityMatch[0];
          partNumber = basePartNumber;
        } else {
          // If no valid quantity found, treat as part of part number
          partNumber = scannedCode.split("@")[0].split("_")[0].trim();
        }
      }
    }

    // If no dash found, check for price separators directly
    if (!quantity) {
      if (scannedCode.includes("@")) {
        const parts = scannedCode.split("@");
        partNumber = parts[0].trim();
        sellingPrice = parts[1]?.trim() || "";
      } else if (scannedCode.includes("_")) {
        const parts = scannedCode.split("_");
        partNumber = parts[0].trim();
        sellingPrice = parts[1]?.trim() || "";
      }
    }

    // Clean up the price (remove non-numeric characters except decimal point)
    if (sellingPrice) {
      sellingPrice = sellingPrice.replace(/[^\d.]/g, "");
      // Ensure only one decimal point
      const decimalCount = (sellingPrice.match(/\./g) || []).length;
      if (decimalCount > 1) {
        const firstDecimal = sellingPrice.indexOf(".");
        sellingPrice =
          sellingPrice.substring(0, firstDecimal + 1) +
          sellingPrice.substring(firstDecimal + 1).replace(/\./g, "");
      }
    }

    // Clean up quantity (ensure it's numeric)
    if (quantity) {
      quantity = quantity.replace(/[^\d]/g, "");
    }

    return { partNumber, quantity, sellingPrice };
  };

  const handleQuickScan = (raw: string) => {
    const now = Date.now();
    if (now - lastScanAtRef.current < SCAN_DEBOUNCE_MS) return; // hard debounce

    setShowQRScanner(false);
    setShowBarcodeScanner(false);
    setShowHybridScanner(false);

    const scannedCode = normalizeCode(raw);
    if (!scannedCode) {
      toast({ title: "Invalid Code", description: "Scanned code is empty", variant: "destructive" });
      return;
    }

    // parse (your existing parser preserved)
    const { partNumber, quantity, sellingPrice } = parseScannedCode(scannedCode);
    const scannedQty = parseInt(quantity) || 1;
    const matched = findPartByCode(partNumber, spareParts);

    // REPEAT SCAN path (same raw code within window)
    console.log("=== SCAN DEBUG ===");
    console.log("Current code:", scannedCode);
    console.log("Last scanned code:", lastScannedCode);
    console.log("Time since last scan:", now - lastScanAtRef.current, "ms");
    console.log("Window limit:", SAME_CODE_WINDOW_MS, "ms");
    
    if (lastScannedCode && scannedCode === lastScannedCode) {
      console.log("REPEAT SCAN DETECTED - auto-incrementing quantity");
      const newCount = scanCount + 1;
      setScanCount(newCount);
      
      if (matched) {
        // Show confirmation dialog for repeat scan
        setRepeatScanPart(matched);
        setPendingScannedCode(scannedCode);
        setShowRepeatScanDialog(true);
        
        toast({
          title: `Repeat Scan ${newCount + 1}`,
          description: `${matched.name}: Confirm to add +${scannedQty} more (Current: ${matched.quantity})`,
          duration: 3000,
        });
      } else {
        toast({
          title: "Same Code Detected",
          description: `Unknown code scanned ${newCount + 1} times - no part to increment`,
          variant: "destructive"
        });
      }
      return;
    }

    // NEW CODE path
    console.log("NEW CODE PATH - setting up for future repeat detection");
    setLastScannedCode(scannedCode);
    setScanCount(0);
    setAccumulatedQuantity(1);
    lastScanAtRef.current = now;

    if (matched) {
      // Show confirmation dialog for existing part
      setRepeatScanPart(matched);
      setPendingScannedCode(scannedCode);
      setShowRepeatScanDialog(true);
      
      toast({
        title: "Part Already Exists",
        description: `${matched.name} (Current: ${matched.quantity}). Confirm to add +${scannedQty} more.`,
        duration: 4000,
      });
    } else {
      // open create prefilled
      setEditingPart(null);
      setFormData({
        partNumber,
        name: "",
        price: sellingPrice || "",
        costPrice: "0",
        quantity: scannedQty.toString(),
        lowStockThreshold: "2",
        barcode: scannedCode,
      });
      setIsDialogOpen(true);
      toast({
        title: "New Part",
        description: `Code captured. ${scannedQty > 1 ? `Qty ${scannedQty}. ` : ""}${sellingPrice ? `Price ₹${sellingPrice}.` : ""}Fill remaining details.`,
      });
    }
  };

  const handleDelete = (part: any) => {
    if (confirm(`Are you sure you want to delete "${part.name}"?`)) {
      deletePartMutation.mutate(part.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="screen-header">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold">Spare Parts</h2>
          </div>
        </div>
        <div className="screen-content flex items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="text-muted-foreground">
              Loading spare parts...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="screen-header">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">Spare Parts</h2>
        </div>
      </div>

      <div className="screen-content">
        {/* Action Buttons */}
        <div className="flex space-x-2 mb-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Add New Part
              </Button>
            </DialogTrigger>
          </Dialog>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowHybridScanner(true)}
            className="shrink-0"
            title="Scan code"
          >
            <QrCode className="w-5 h-5" />
          </Button>
        </div>

        {/* Scan Counter Display */}
        {scanCount > 0 && lastScannedCode && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <QrCode className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Repeat Scans: {scanCount + 1}
                </span>
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                Code: {lastScannedCode.substring(0, 20)}
                {lastScannedCode.length > 20 ? "..." : ""}
              </div>
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Each confirmation adds +1 to stock
            </div>
          </div>
        )}

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            // Don't reset scan state when closing dialog - preserve for repeat scanning
          }}
        >
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPart ? "Edit" : "Add New"} Spare Part
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="partNumber">Part Number *</Label>
                <Input
                  id="partNumber"
                  value={formData.partNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      partNumber: e.target.value,
                    }))
                  }
                  placeholder="Enter unique part number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Part Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter part name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="price">Selling Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, price: e.target.value }))
                  }
                  className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ appearance: "textfield" }}
                  required
                />
              </div>
              <div>
                <Label htmlFor="costPrice">Cost Price (₹)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.costPrice}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      costPrice: e.target.value,
                    }))
                  }
                  className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ appearance: "textfield" }}
                  placeholder="Purchase cost per unit"
                />
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      quantity: e.target.value,
                    }))
                  }
                  className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ appearance: "textfield" }}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="0"
                  value={formData.lowStockThreshold}
                  className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ appearance: "textfield" }}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      lowStockThreshold: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="barcode">Barcode (Optional)</Label>
                <div className="flex space-x-2">
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        barcode: e.target.value,
                      }))
                    }
                    placeholder="Scan or enter barcode"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowHybridScanner(true)}
                    className="shrink-0"
                    title="Scan code"
                  >
                    <QrCode className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={
                    createPartMutation.isPending || updatePartMutation.isPending
                  }
                >
                  {editingPart ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Search and Filter */}
        <div className="flex space-x-2 mb-4">
          <div className="flex-1 relative search-bar-container">
            <Search className="search-icon w-4 h-4" />
            <Input
              type="text"
              placeholder="Search parts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <Button
            variant={showLowStockOnly ? "default" : "outline"}
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={
              showLowStockOnly
                ? "border-destructive bg-destructive text-destructive-foreground"
                : "border-destructive text-destructive"
            }
          >
            <TriangleAlert className="w-4 h-4" />
          </Button>
        </div>

        {/* Parts List */}
        {filteredParts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                {searchTerm
                  ? "No parts found matching your search"
                  : "No spare parts yet"}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredParts.map((part: any) => (
              <Card key={part.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{part.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          #{part.partNumber}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Price: ₹{Number(part.price).toFixed(2)}
                      </p>

                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm text-muted-foreground">
                            Stock:
                          </span>
                          <span
                            className={`text-sm font-medium ${
                              part.quantity <= part.lowStockThreshold
                                ? "text-destructive"
                                : "text-foreground"
                            }`}
                          >
                            {part.quantity}
                          </span>
                        </div>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            part.quantity <= part.lowStockThreshold
                              ? "bg-destructive"
                              : "bg-green-500"
                          }`}
                        />
                        {part.quantity <= part.lowStockThreshold && (
                          <Badge variant="destructive" className="text-xs">
                            Low Stock
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(part)}
                        className="px-3 py-1 text-xs"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      {!isStaff && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(part)}
                          className="px-3 py-1 text-xs text-destructive border-destructive hover:bg-destructive/10"
                          disabled={deletePartMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* QR Scanner */}
        <QRScanner
          isOpen={showQRScanner}
          onClose={() => {
            setShowQRScanner(false);
            resetScanState();
          }}
          onScan={handleQuickScan}
        />

        {/* Hybrid Scanner */}
        <HybridScanner
          isOpen={showHybridScanner}
          onClose={() => {
            setShowHybridScanner(false);
            resetScanState();
          }}
          onScan={handleQuickScan}
        />

        {/* Repeat Scan Confirmation Dialog */}
        <AlertDialog
          open={showRepeatScanDialog}
          onOpenChange={setShowRepeatScanDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-blue-500" />
                <span>Same Code Scanned Again!</span>
              </AlertDialogTitle>
              <AlertDialogDescription>
                <div className="space-y-3">
                  <div>
                    You scanned the same code{" "}
                    <strong>{scanCount + 1} times</strong>.
                    {repeatScanPart && (
                      <span> Confirm to add +1 unit to stock.</span>
                    )}
                  </div>

                  {repeatScanPart ? (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="font-medium text-blue-900 dark:text-blue-100">
                        {repeatScanPart.name}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Part Number: {repeatScanPart.partNumber}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        Current Stock: {repeatScanPart.quantity}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        Price: ₹{repeatScanPart.price}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div className="font-medium text-amber-900 dark:text-amber-100">
                        Unknown Code: {pendingScannedCode}
                      </div>
                      <div className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        This code is not in your inventory yet
                      </div>
                    </div>
                  )}

                  {repeatScanPart && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="text-sm font-medium text-green-900 dark:text-green-100">
                        Quantity to Add: +1
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        New Total: {repeatScanPart.quantity + 1}
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground">
                    {repeatScanPart
                      ? "Would you like to add 1 unit to stock?"
                      : "Would you like to process this code normally?"}
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleDenyRepeatScan}>
                No, Ignore Scan
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmRepeatScan}>
                {repeatScanPart ? "Yes, Add +1 to Stock" : "Yes, Process Code"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Duplicate Part Alert Dialog */}
        <AlertDialog
          open={showDuplicateAlert}
          onOpenChange={setShowDuplicateAlert}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center space-x-2">
                {scanCount > 0 ? (
                  <>
                    <QrCode className="w-5 h-5 text-blue-500" />
                    <span>Same Code Spotted Again!</span>
                  </>
                ) : (
                  <>
                    <TriangleAlert className="w-5 h-5 text-destructive" />
                    <span>Duplicate Part Number Detected</span>
                  </>
                )}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {scanCount > 0 ? (
                  <>
                    You scanned the same code again. The part already exists:
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="font-medium text-blue-900 dark:text-blue-100">
                        {duplicatePart?.name}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Part Number: {duplicatePart?.partNumber}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        Current quantity: {duplicatePart?.quantity}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        Price: ₹{duplicatePart?.price}
                      </div>
                    </div>
                    <div className="mt-3 text-blue-800 dark:text-blue-200">
                      Total scans: {scanCount + 1} | Total quantity to add:{" "}
                      {accumulatedQuantity}
                      <br />
                      Would you like to add all {accumulatedQuantity} units?
                    </div>
                  </>
                ) : (
                  <>
                    A spare part with part number "{formData.partNumber}"
                    already exists:
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <strong>{duplicatePart?.name}</strong>
                      <br />
                      Current quantity: {duplicatePart?.quantity}
                      <br />
                      Price: ₹{duplicatePart?.price}
                    </div>
                    <br />
                    Instead of creating a duplicate, would you like to increase
                    the quantity by {formData.quantity}?
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setShowDuplicateAlert(false);
                  resetScanState();
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleIncreaseQuantity}
                className="bg-primary hover:bg-primary/90"
              >
                {scanCount > 0
                  ? `Yes, Add All ${accumulatedQuantity}`
                  : "Increase Quantity"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
