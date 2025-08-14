import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, IndianRupee } from "lucide-react";

interface CustomerData {
  customerName: string;
  serviceCount: number;
  totalRevenue: number;
}

interface CustomerAnalyticsChartsProps {
  serviceData: CustomerData[];
  revenueData: CustomerData[];
  isLoading: boolean;
}

export function CustomerAnalyticsCharts({ serviceData, revenueData, isLoading }: CustomerAnalyticsChartsProps) {
  const formatCurrency = (value: number) => `₹${Number(value || 0).toLocaleString()}`;
  
  const truncateCustomerName = (name: string, maxLength: number = 12) => {
    return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-muted animate-pulse rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-muted animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Customers by Service Count */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Top Customers by Services</CardTitle>
          <Users className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={serviceData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              layout="horizontal"
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                type="number"
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                type="category"
                dataKey="customerName" 
                tickFormatter={(name) => truncateCustomerName(name, 15)}
                fontSize={11}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                width={120}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [value, 'Services']}
                labelFormatter={(label) => `Customer: ${label}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar 
                dataKey="serviceCount" 
                fill="hsl(var(--primary))" 
                radius={[0, 4, 4, 0]}
                name="Services"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Customers by Revenue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Top Customers by Revenue</CardTitle>
          <IndianRupee className="h-5 w-5 text-green-600" />
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={revenueData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              layout="horizontal"
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                type="number"
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                type="category"
                dataKey="customerName" 
                tickFormatter={(name) => truncateCustomerName(name, 15)}
                fontSize={11}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                width={120}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                labelFormatter={(label) => `Customer: ${label}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar 
                dataKey="totalRevenue" 
                fill="#10b981" 
                radius={[0, 4, 4, 0]}
                name="Revenue"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}