import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, DollarSign } from "lucide-react";

interface ServiceBreakdown {
  baseServiceCharge: number;
  includeWaterWash: boolean;
  waterWashCharge: number;
  includeDiesel: boolean;
  dieselCharge: number;
  includePetrol: boolean;
  petrolCharge: number;
  totalServiceCharge: number;
}

interface ServiceBreakdownDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (breakdown: ServiceBreakdown) => void;
  initialServiceCharge?: number;
  initialBreakdown?: Partial<ServiceBreakdown>;
}

export function ServiceBreakdownDialog({
  isOpen,
  onClose,
  onSave,
  initialServiceCharge = 0,
  initialBreakdown = {}
}: ServiceBreakdownDialogProps) {
  const [breakdown, setBreakdown] = useState<ServiceBreakdown>({
    baseServiceCharge: initialBreakdown.baseServiceCharge || initialServiceCharge,
    includeWaterWash: initialBreakdown.includeWaterWash || false,
    waterWashCharge: initialBreakdown.waterWashCharge || 0,
    includeDiesel: initialBreakdown.includeDiesel || false,
    dieselCharge: initialBreakdown.dieselCharge || 0,
    includePetrol: initialBreakdown.includePetrol || false,
    petrolCharge: initialBreakdown.petrolCharge || 0,
    totalServiceCharge: initialBreakdown.totalServiceCharge || initialServiceCharge,
  });

  // Calculate total service charge whenever any component changes
  useEffect(() => {
    const total = 
      breakdown.baseServiceCharge +
      (breakdown.includeWaterWash ? breakdown.waterWashCharge : 0) +
      (breakdown.includeDiesel ? breakdown.dieselCharge : 0) +
      (breakdown.includePetrol ? breakdown.petrolCharge : 0);
    
    setBreakdown(prev => ({ ...prev, totalServiceCharge: total }));
  }, [
    breakdown.baseServiceCharge,
    breakdown.includeWaterWash,
    breakdown.waterWashCharge,
    breakdown.includeDiesel,
    breakdown.dieselCharge,
    breakdown.includePetrol,
    breakdown.petrolCharge
  ]);

  const handleSave = () => {
    onSave(breakdown);
    onClose();
  };

  const handleInputChange = (field: keyof ServiceBreakdown, value: string | number | boolean) => {
    setBreakdown(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calculator className="w-5 h-5" />
            <span>Service Charge Breakdown</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Base Service Charge */}
          <div>
            <Label htmlFor="baseServiceCharge">Base Service Charge (₹)</Label>
            <Input
              id="baseServiceCharge"
              type="number"
              step="1"
              min="0"
              value={breakdown.baseServiceCharge}
              onChange={(e) => handleInputChange('baseServiceCharge', e.target.value)}
              placeholder="Enter base service amount"
              data-testid="input-base-service-charge"
            />
          </div>

          {/* Additional Services */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Additional Services</Label>
            
            {/* Water Wash */}
            <Card className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeWaterWash"
                    checked={breakdown.includeWaterWash}
                    onCheckedChange={(checked) => handleInputChange('includeWaterWash', checked as boolean)}
                    data-testid="checkbox-water-wash"
                  />
                  <Label htmlFor="includeWaterWash" className="text-sm">Water Wash</Label>
                </div>
              </div>
              {breakdown.includeWaterWash && (
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={breakdown.waterWashCharge}
                  onChange={(e) => handleInputChange('waterWashCharge', e.target.value)}
                  placeholder="Enter water wash charge"
                  className="text-sm"
                  data-testid="input-water-wash-charge"
                />
              )}
            </Card>

            {/* Diesel */}
            <Card className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeDiesel"
                    checked={breakdown.includeDiesel}
                    onCheckedChange={(checked) => handleInputChange('includeDiesel', checked as boolean)}
                    data-testid="checkbox-diesel"
                  />
                  <Label htmlFor="includeDiesel" className="text-sm">Diesel</Label>
                </div>
              </div>
              {breakdown.includeDiesel && (
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={breakdown.dieselCharge}
                  onChange={(e) => handleInputChange('dieselCharge', e.target.value)}
                  placeholder="Enter diesel charge"
                  className="text-sm"
                  data-testid="input-diesel-charge"
                />
              )}
            </Card>

            {/* Petrol */}
            <Card className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includePetrol"
                    checked={breakdown.includePetrol}
                    onCheckedChange={(checked) => handleInputChange('includePetrol', checked as boolean)}
                    data-testid="checkbox-petrol"
                  />
                  <Label htmlFor="includePetrol" className="text-sm">Petrol</Label>
                </div>
              </div>
              {breakdown.includePetrol && (
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={breakdown.petrolCharge}
                  onChange={(e) => handleInputChange('petrolCharge', e.target.value)}
                  placeholder="Enter petrol charge"
                  className="text-sm"
                  data-testid="input-petrol-charge"
                />
              )}
            </Card>
          </div>

          {/* Total Service Charge */}
          <div className="bg-primary/5 p-3 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <Label className="font-semibold">Total Service Charge</Label>
              </div>
              <div className="text-lg font-bold text-primary" data-testid="text-total-service-charge">
                ₹{breakdown.totalServiceCharge.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="flex-1"
              data-testid="button-save-breakdown"
            >
              Save Breakdown
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}