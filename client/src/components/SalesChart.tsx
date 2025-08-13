import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calendar, X } from "lucide-react";

interface SalesChartProps {
  title: string;
  type: 'service' | 'parts' | 'profit';
  isOpen: boolean;
  onClose: () => void;
  data: Array<{
    period: string;
    serviceCharges: number;
    partsRevenue: number;
    profit: number;
    invoiceCount: number;
  }>;
  onFilterChange: (filter: {
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
    startDate?: string;
    endDate?: string;
  }) => void;
}

export function SalesChart({ title, type, isOpen, onClose, data, onFilterChange }: SalesChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const getDataKey = () => {
    switch (type) {
      case 'service': return 'serviceCharges';
      case 'parts': return 'partsRevenue';
      case 'profit': return 'profit';
      default: return 'serviceCharges';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'service': return '#3b82f6';
      case 'parts': return '#10b981';
      case 'profit': return '#f59e0b';
      default: return '#3b82f6';
    }
  };

  const handleFilterApply = () => {
    if (selectedPeriod === 'custom' && startDate && endDate) {
      onFilterChange({ period: selectedPeriod, startDate, endDate });
    } else if (selectedPeriod !== 'custom') {
      const now = new Date();
      let start = new Date();
      
      switch (selectedPeriod) {
        case 'daily':
          start.setDate(now.getDate() - 30);
          break;
        case 'weekly':
          start.setDate(now.getDate() - 7 * 12);
          break;
        case 'monthly':
          start.setMonth(now.getMonth() - 12);
          break;
        case 'quarterly':
          start.setMonth(now.getMonth() - 12);
          break;
        case 'yearly':
          start.setFullYear(now.getFullYear() - 5);
          break;
      }
      
      onFilterChange({
        period: selectedPeriod,
        startDate: start.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{title} Analytics</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Time Period</Label>
              <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedPeriod === 'custom' && (
              <>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
            
            <div className="flex items-end">
              <Button onClick={handleFilterApply} className="w-full">
                <Calendar className="w-4 h-4 mr-2" />
                Apply Filter
              </Button>
            </div>
          </div>

          {/* Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis tickFormatter={(value) => `₹${value.toLocaleString()}`} />
                <Tooltip 
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, title]}
                  labelFormatter={(label) => `Period: ${label}`}
                />
                <Bar dataKey={getDataKey()} fill={getColor()} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">₹{data.reduce((sum, item) => sum + item[getDataKey()], 0).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total {title}</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">₹{data.length > 0 ? Math.round(data.reduce((sum, item) => sum + item[getDataKey()], 0) / data.length).toLocaleString() : 0}</div>
              <div className="text-sm text-muted-foreground">Average</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">₹{Math.max(...data.map(item => item[getDataKey()]), 0).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Peak</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{data.reduce((sum, item) => sum + item.invoiceCount, 0)}</div>
              <div className="text-sm text-muted-foreground">Total Invoices</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}