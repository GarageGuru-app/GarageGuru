import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnalyticsFilter } from "@/components/AnalyticsFilter";
import { ArrowLeft, X } from "lucide-react";

interface Analytics3DChartProps {
  title: string;
  type: 'service' | 'parts' | 'profit';
  isOpen: boolean;
  onClose: () => void;
  data: Array<{
    period: string;
    totalSales: number;
    serviceCharges: number;
    partsRevenue: number;
    invoiceCount: number;
    profit: number;
  }>;
  onFilterChange: (filter: {
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
    startDate?: string;
    endDate?: string;
  }) => void;
  isLoading?: boolean;
}

export function Analytics3DChart({ 
  title, 
  type, 
  isOpen, 
  onClose, 
  data, 
  onFilterChange,
  isLoading = false 
}: Analytics3DChartProps) {
  if (!isOpen) return null;

  const formatPeriod = (period: any) => {
    // Ensure period is a string
    const periodStr = String(period || '');
    
    // Handle hourly format (YYYY-MM-DD HH:00)
    if (periodStr.match(/^\d{4}-\d{2}-\d{2} \d{2}:00$/)) {
      const date = new Date(periodStr.replace(' ', 'T') + ':00');
      return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
    }
    
    // Handle daily format (YYYY-MM-DD)
    if (periodStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const date = new Date(periodStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    // Handle monthly format (YYYY-MM)
    if (periodStr.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = periodStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    
    // Handle quarterly format (YYYY-Q1, YYYY-Q2, etc.)
    if (periodStr.match(/^\d{4}-Q[1-4]$/)) {
      const [year, quarter] = periodStr.split('-');
      return `${quarter} ${year}`;
    }
    
    // Handle yearly format (YYYY)
    if (periodStr.match(/^\d{4}$/)) {
      return periodStr;
    }
    
    return periodStr || 'Unknown';
  };

  const getValue = (item: any) => {
    let value;
    switch (type) {
      case 'service':
        value = item.serviceCharges || item.revenue || 0;
        break;
      case 'parts':
        value = item.partsRevenue || 0;
        break;
      case 'profit':
        value = item.profit || item.serviceCharges || item.revenue || 0;
        break;
      default:
        value = item.totalSales || item.revenue || 0;
    }
    return Number(value) || 0;
  };

  const maxValue = data.length > 0 ? Math.max(...data.map(getValue).filter(v => !isNaN(v) && v > 0)) || 1 : 1;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-6xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-semibold">{title}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-6">
          {/* Filter */}
          <AnalyticsFilter 
            onFilterChange={onFilterChange}
            isLoading={isLoading}
          />

          {/* 3D Chart Container */}
          <Card>
            <CardHeader>
              <CardTitle>
                {type === 'service' ? 'Service Revenue' : 
                 type === 'parts' ? 'Spares Revenue' : 
                 'Profit'} Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : data.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No data available for the selected period
                </div>
              ) : (
                <div className="w-full bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                  {/* Chart Container with Grid Layout */}
                  <div className="flex">
                    {/* Y-Axis */}
                    <div className="flex flex-col justify-between h-80 pr-4 text-xs text-gray-600 dark:text-gray-400 w-16">
                      <span>₹{Number(maxValue || 0).toLocaleString()}</span>
                      <span>₹{Math.round((maxValue || 0) * 0.75).toLocaleString()}</span>
                      <span>₹{Math.round((maxValue || 0) * 0.5).toLocaleString()}</span>
                      <span>₹{Math.round((maxValue || 0) * 0.25).toLocaleString()}</span>
                      <span>₹0</span>
                    </div>
                    
                    {/* Chart Area with Vertical Scrolling Grid */}
                    <div className="flex-1 overflow-y-auto max-h-80">
                      <div className="space-y-6">
                        {/* Group data into rows of 7 bars each */}
                        {(() => {
                          const rows = [];
                          const itemsPerRow = 7;
                          
                          for (let i = 0; i < data.length; i += itemsPerRow) {
                            const rowData = data.slice(i, i + itemsPerRow);
                            rows.push(
                              <div key={i} className="min-h-80">
                                <div className="flex items-end justify-start space-x-4 h-72 py-4">
                                  {rowData.map((item, rowIndex) => {
                                    const value = getValue(item);
                                    const height = maxValue > 0 ? Math.max(20, (value / maxValue) * 200) : 20;
                                    
                                    return (
                                      <div 
                                        key={item.period} 
                                        className="flex flex-col items-center relative group"
                                        style={{ minWidth: '80px' }}
                                      >
                                        {/* 3D Bar */}
                                        <div 
                                          className="relative mb-3"
                                          style={{ height: `${height}px` }}
                                        >
                                          {/* Premium Glass Bar */}
                                          <div
                                            className="w-12 h-full relative rounded-t-lg overflow-hidden shadow-lg transition-shadow duration-300 group-hover:shadow-xl"
                                            style={{
                                              background: `linear-gradient(135deg, 
                                                rgba(59, 130, 246, 0.9) 0%,
                                                rgba(37, 99, 235, 0.95) 25%,
                                                rgba(59, 130, 246, 0.85) 50%,
                                                rgba(29, 78, 216, 0.9) 75%,
                                                rgba(37, 99, 235, 0.95) 100%)`,
                                              boxShadow: `
                                                0 8px 32px rgba(59, 130, 246, 0.3),
                                                inset 0 1px 0 rgba(255, 255, 255, 0.4),
                                                inset 0 -1px 0 rgba(0, 0, 0, 0.1),
                                                inset 1px 0 0 rgba(255, 255, 255, 0.2),
                                                inset -1px 0 0 rgba(0, 0, 0, 0.1)
                                              `,
                                              transform: 'perspective(1000px) rotateX(5deg)',
                                            }}
                                          >
                                            {/* Glass highlights */}
                                            <div 
                                              className="absolute top-0 left-0 w-full h-1/3 rounded-t-lg"
                                              style={{
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.2) 100%)',
                                              }}
                                            />
                                            <div 
                                              className="absolute top-0 left-1 w-1 h-full rounded-full"
                                              style={{
                                                background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.8) 0%, transparent 50%)',
                                              }}
                                            />
                                          </div>
                                          
                                          {/* 3D depth effect - fixed position */}
                                          <div
                                            className="absolute top-1 w-12 h-full rounded-t-lg"
                                            style={{
                                              right: '-4px',
                                              background: `linear-gradient(135deg, 
                                                rgba(29, 78, 216, 0.7) 0%,
                                                rgba(37, 99, 235, 0.8) 50%,
                                                rgba(29, 78, 216, 0.9) 100%)`,
                                              transform: 'perspective(1000px) rotateY(-45deg) rotateX(5deg) skewY(-5deg)',
                                              zIndex: -1,
                                              filter: 'blur(0.5px)',
                                            }}
                                          />
                                          
                                          {/* Base shadow */}
                                          <div
                                            className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-14 h-2 rounded-full"
                                            style={{
                                              background: 'radial-gradient(ellipse, rgba(0, 0, 0, 0.3) 0%, transparent 70%)',
                                              filter: 'blur(2px)',
                                            }}
                                          />
                                        </div>

                                        {/* Value Label */}
                                        <div className="text-center mb-2">
                                          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            ₹{Number(value || 0).toLocaleString()}
                                          </div>
                                        </div>
                                        
                                        {/* Period Label */}
                                        <div className="text-xs text-muted-foreground text-center max-w-[80px] leading-tight">
                                          {formatPeriod(item.period)}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                {/* Row separator */}
                                {i + itemsPerRow < data.length && (
                                  <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent mt-4" />
                                )}
                              </div>
                            );
                          }
                          
                          return rows;
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  {/* X-Axis Label */}
                  <div className="text-center mt-4">
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Time Period
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Statistics */}
          {!isLoading && data.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    ₹{Number(data.reduce((sum, item) => sum + getValue(item), 0) || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{Number(Math.round((data.reduce((sum, item) => sum + getValue(item), 0) || 0) / (data.length || 1)) || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Average</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    ₹{Number(Math.max(...data.map(getValue).filter(v => !isNaN(v))) || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Highest</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {data.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Data Points</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}