
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, DollarSign } from "lucide-react";
import { formatCurrency, Invoice } from "@/utils/supabaseDataManager";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts";

interface RevenueAnalyticsProps {
  invoices: Invoice[];
}

type TimePeriod = 'day' | 'week' | 'month' | 'year';

const RevenueAnalytics = ({ invoices }: RevenueAnalyticsProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');

  const revenueData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let dateFormat: Intl.DateTimeFormatOptions;
    let groupByKey: (date: Date) => string;

    switch (selectedPeriod) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        dateFormat = { month: 'short', day: 'numeric' };
        groupByKey = (date) => date.toISOString().split('T')[0];
        break;
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 28);
        dateFormat = { month: 'short', day: 'numeric' };
        groupByKey = (date) => {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          return weekStart.toISOString().split('T')[0];
        };
        break;
      case 'month':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        dateFormat = { year: 'numeric', month: 'short' };
        groupByKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 5, 0, 1);
        dateFormat = { year: 'numeric' };
        groupByKey = (date) => String(date.getFullYear());
        break;
    }

    const filteredInvoices = invoices.filter(invoice => 
      new Date(invoice.created_at) >= startDate
    );

    const groupedData = filteredInvoices.reduce((acc, invoice) => {
      const date = new Date(invoice.created_at);
      const key = groupByKey(date);
      
      if (!acc[key]) {
        acc[key] = {
          period: key,
          revenue: 0,
          count: 0,
          date: date
        };
      }
      
      acc[key].revenue += invoice.total;
      acc[key].count += 1;
      
      return acc;
    }, {} as Record<string, { period: string; revenue: number; count: number; date: Date }>);

    return Object.values(groupedData)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(item => ({
        period: item.date.toLocaleDateString('en-US', dateFormat),
        revenue: item.revenue,
        count: item.count
      }));
  }, [invoices, selectedPeriod]);

  const currentPeriodRevenue = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (selectedPeriod) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        startDate = weekStart;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    return invoices
      .filter(invoice => new Date(invoice.created_at) >= startDate)
      .reduce((sum, invoice) => sum + invoice.total, 0);
  }, [invoices, selectedPeriod]);

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "#3B82F6",
    },
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Analytics
            </CardTitle>
            <div className="flex gap-2">
              {(['day', 'week', 'month', 'year'] as TimePeriod[]).map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                  className="capitalize"
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-500">
                Revenue this {selectedPeriod}
              </span>
            </div>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(currentPeriodRevenue)}
            </div>
          </div>

          {revenueData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="period" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="#3B82F6" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No revenue data for this period</p>
                <p className="text-sm">Create invoices to see analytics here</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueAnalytics;
