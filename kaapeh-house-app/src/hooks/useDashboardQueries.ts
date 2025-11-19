import { useQuery } from '@tanstack/react-query';
import {
  fetchDashboardData,
  fetchTodaysMetrics,
  fetchWeeklySales,
  fetchTopItemsToday,
  DashboardMetrics,
  WeeklySalesData,
  TopItem,
} from '../services/dashboardService';

// Query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  metrics: () => [...dashboardKeys.all, 'metrics'] as const,
  weeklySales: () => [...dashboardKeys.all, 'weeklySales'] as const,
  topItems: () => [...dashboardKeys.all, 'topItems'] as const,
  allData: () => [...dashboardKeys.all, 'allData'] as const,
};

// Hook to fetch all dashboard data
export function useDashboardData() {
  return useQuery({
    queryKey: dashboardKeys.allData(),
    queryFn: fetchDashboardData,
    staleTime: 30 * 1000, // 30 seconds - dashboard data changes frequently
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000, // Auto-refetch every minute
  });
}

// Hook to fetch today's metrics only
export function useTodaysMetrics() {
  return useQuery<DashboardMetrics>({
    queryKey: dashboardKeys.metrics(),
    queryFn: fetchTodaysMetrics,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

// Hook to fetch weekly sales only
export function useWeeklySales() {
  return useQuery<WeeklySalesData[]>({
    queryKey: dashboardKeys.weeklySales(),
    queryFn: fetchWeeklySales,
    staleTime: 5 * 60 * 1000, // 5 minutes - weekly data doesn't change as frequently
    gcTime: 10 * 60 * 1000,
  });
}

// Hook to fetch top items today only
export function useTopItemsToday(limit: number = 3) {
  return useQuery<TopItem[]>({
    queryKey: [...dashboardKeys.topItems(), limit],
    queryFn: () => fetchTopItemsToday(limit),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

