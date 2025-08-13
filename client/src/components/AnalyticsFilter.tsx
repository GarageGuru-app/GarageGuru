import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Filter } from "lucide-react";

interface AnalyticsFilterProps {
  onFilterChange: (filter: {
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
    startDate?: string;
    endDate?: string;
  }) => void;
  isLoading?: boolean;
}

export function AnalyticsFilter({ onFilterChange, isLoading }: AnalyticsFilterProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleFilterApply = () => {
    if (selectedPeriod === 'custom' && startDate && endDate) {
      onFilterChange({ period: selectedPeriod, startDate, endDate });
    } else if (selectedPeriod !== 'custom') {
      const now = new Date();
      let start = new Date();
      
      switch (selectedPeriod) {
        case 'daily':
          start.setDate(now.getDate() - 6); // Last 7 days including today
          break;
        case 'weekly':
          start.setDate(now.getDate() - (7 * 12)); // Last 12 weeks
          break;
        case 'monthly':
          start.setMonth(now.getMonth() - 12); // Last 12 months
          break;
        case 'quarterly':
          start.setFullYear(now.getFullYear() - 2); // Last 8 quarters (2 years)
          break;
        case 'yearly':
          start.setFullYear(now.getFullYear() - 5); // Last 5 years
          break;
      }
      
      const startDateStr = start.toISOString().split('T')[0];
      const endDateStr = now.toISOString().split('T')[0];
      console.log(`Filter applied: ${selectedPeriod}, ${startDateStr} to ${endDateStr}`);
      
      onFilterChange({ 
        period: selectedPeriod, 
        startDate: startDateStr, 
        endDate: endDateStr 
      });
    }
  };

  const handlePeriodChange = (period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom') => {
    setSelectedPeriod(period);
    if (period !== 'custom') {
      // Auto-apply filter for non-custom periods
      setTimeout(() => {
        const now = new Date();
        let start = new Date();
        
        switch (period) {
          case 'daily':
            start.setDate(now.getDate() - 6); // Last 7 days including today
            break;
          case 'weekly':
            start.setDate(now.getDate() - (7 * 12));
            break;
          case 'monthly':
            start.setMonth(now.getMonth() - 12);
            break;
          case 'quarterly':
            start.setFullYear(now.getFullYear() - 2);
            break;
          case 'yearly':
            start.setFullYear(now.getFullYear() - 5);
            break;
        }
        
        const startDateStr = start.toISOString().split('T')[0];
        const endDateStr = now.toISOString().split('T')[0];
        console.log(`Auto-filter applied: ${period}, ${startDateStr} to ${endDateStr}`);
        
        onFilterChange({ 
          period, 
          startDate: startDateStr, 
          endDate: endDateStr 
        });
      }, 100);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Date Range Filter</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period">Period</Label>
              <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
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
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div className="flex items-end">
                  <Button 
                    onClick={handleFilterApply} 
                    disabled={isLoading || !startDate || !endDate}
                    className="w-full"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Apply Filter
                  </Button>
                </div>
              </>
            )}
          </div>

          {selectedPeriod !== 'custom' && (
            <div className="text-sm text-muted-foreground">
              Showing data for the last {
                selectedPeriod === 'daily' ? '30 days' :
                selectedPeriod === 'weekly' ? '12 weeks' :
                selectedPeriod === 'monthly' ? '12 months' :
                selectedPeriod === 'quarterly' ? '4 quarters' :
                '5 years'
              }
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}