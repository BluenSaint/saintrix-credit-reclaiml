import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { format } from 'date-fns';

interface RevenueData {
  total_revenue: number;
  total_subscribers: number;
  subscriptions_by_tier: {
    [key: string]: number;
  };
  monthly_revenue: {
    month: string;
    amount: number;
  }[];
}

export const RevenuePanel: React.FC = () => {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchRevenueData();
  }, [timeRange]);

  const fetchRevenueData = async () => {
    try {
      // In a real app, this would fetch from Stripe API
      // For now, we'll use mock data
      const mockData: RevenueData = {
        total_revenue: 125000,
        total_subscribers: 250,
        subscriptions_by_tier: {
          basic: 150,
          premium: 75,
          enterprise: 25,
        },
        monthly_revenue: [
          { month: '2024-01', amount: 15000 },
          { month: '2024-02', amount: 17500 },
          { month: '2024-03', amount: 20000 },
        ],
      };

      setRevenueData(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch revenue data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading revenue data...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!revenueData) {
    return <div>No revenue data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Revenue Dashboard</h2>
        <Select
          value={timeRange}
          onValueChange={setTimeRange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="1y">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold">
            ${revenueData.total_revenue.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            All time revenue
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Total Subscribers</h3>
          <p className="text-3xl font-bold">
            {revenueData.total_subscribers}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Active subscriptions
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Average Revenue</h3>
          <p className="text-3xl font-bold">
            ${(revenueData.total_revenue / revenueData.total_subscribers).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Per subscriber
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Subscriptions by Tier</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(revenueData.subscriptions_by_tier).map(([tier, count]) => (
            <div key={tier} className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 capitalize">{tier}</p>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-sm text-gray-500">
                {((count / revenueData.total_subscribers) * 100).toFixed(1)}% of total
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Revenue</h3>
        <div className="space-y-4">
          {revenueData.monthly_revenue.map(({ month, amount }) => (
            <div key={month} className="flex justify-between items-center">
              <p className="text-gray-600">
                {format(new Date(month), 'MMMM yyyy')}
              </p>
              <p className="font-semibold">
                ${amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}; 