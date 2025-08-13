import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, IndianRupee, Wrench, DollarSign } from "lucide-react";

interface SalesData {
  period: string;
  totalSales: number;
  serviceCharges: number;
  partsRevenue: number;
  profit: number;
  invoiceCount: number;
}

interface SalesAnalyticsChartsProps {
  data: SalesData[];
  isLoading: boolean;
}

export function SalesAnalyticsCharts({ data, isLoading }: SalesAnalyticsChartsProps) {
  const formatCurrency = (value: number) => `₹${value.toLocaleString()}`;
  
  const formatPeriod = (period: string) => {
    // Handle hourly format (YYYY-MM-DD HH:00)
    if (period.match(/^\d{4}-\d{2}-\d{2} \d{2}:00$/)) {
      const date = new Date(period.replace(' ', 'T') + ':00');
      return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
    }
    
    // Handle daily format (YYYY-MM-DD)
    if (period.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const date = new Date(period);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    // Handle monthly format (YYYY-MM)
    if (period.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = period.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    
    // Handle quarterly format (YYYY-Q1, YYYY-Q2, etc.)
    if (period.match(/^\d{4}-Q[1-4]$/)) {
      const [year, quarter] = period.split('-');
      return `${quarter} ${year}`;
    }
    
    // Handle yearly format (YYYY)
    if (period.match(/^\d{4}$/)) {
      return period;
    }
    
    // Handle weekly format (start of week date)
    if (period.match(/^\d{4}-\d{2}-\d{2}$/) && data.length > 20) {
      const date = new Date(period);
      return `Week ${Math.ceil(date.getDate() / 7)}/${date.getMonth() + 1}`;
    }
    
    // Default return
    return period;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-muted animate-pulse rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Total Sales Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Total Sales</CardTitle>
          <TrendingUp className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="period" 
                tickFormatter={formatPeriod}
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Total Sales']}
                labelFormatter={formatPeriod}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar 
                dataKey="totalSales" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                name="Total Sales"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Service Revenue Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Service Revenue</CardTitle>
          <Wrench className="h-5 w-5 text-blue-600" />
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="period" 
                tickFormatter={formatPeriod}
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Service Revenue']}
                labelFormatter={formatPeriod}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar 
                dataKey="serviceCharges" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
                name="Service Revenue"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Spares Revenue Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Spares Revenue</CardTitle>
          <IndianRupee className="h-5 w-5 text-green-600" />
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="period" 
                tickFormatter={formatPeriod}
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Spares Revenue']}
                labelFormatter={formatPeriod}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar 
                dataKey="partsRevenue" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]}
                name="Spares Revenue"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Profit Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Profit</CardTitle>
          <DollarSign className="h-5 w-5 text-amber-600" />
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="period" 
                tickFormatter={formatPeriod}
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Profit']}
                labelFormatter={formatPeriod}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar 
                dataKey="profit" 
                fill="#f59e0b" 
                radius={[4, 4, 0, 0]}
                name="Profit"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}