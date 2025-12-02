import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardData, useTodaysMetrics, useWeeklySales, useTopItemsToday } from '../useDashboardQueries';
import * as dashboardService from '../../services/dashboardService';

// Mock the dashboard service
jest.mock('../../services/dashboardService');

describe('Dashboard Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useDashboardData', () => {
    it('should fetch dashboard data successfully', async () => {
      const mockData = {
        metrics: {
          todaysSales: 150.75,
          ordersToday: 10,
          averagePerOrder: 15.08,
        },
        weeklySales: [
          { day: 'Mon', sales: 50, date: '2025-01-20' },
        ],
        topItems: [
          { name: 'Caffe Mocha', sold: 12, rank: 1, menu_item_id: 'item1' },
        ],
      };

      (dashboardService.fetchDashboardData as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.isError).toBe(false);
    });

    it('should handle errors', async () => {
      const mockError = new Error('Failed to fetch');
      (dashboardService.fetchDashboardData as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useTodaysMetrics', () => {
    it('should fetch today\'s metrics', async () => {
      const mockMetrics = {
        todaysSales: 100.50,
        ordersToday: 5,
        averagePerOrder: 20.10,
      };

      (dashboardService.fetchTodaysMetrics as jest.Mock).mockResolvedValue(mockMetrics);

      const { result } = renderHook(() => useTodaysMetrics(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockMetrics);
    });
  });

  describe('useWeeklySales', () => {
    it('should fetch weekly sales data', async () => {
      const mockWeeklySales = [
        { day: 'Mon', sales: 50, date: '2025-01-20' },
        { day: 'Tue', sales: 75, date: '2025-01-21' },
      ];

      (dashboardService.fetchWeeklySales as jest.Mock).mockResolvedValue(mockWeeklySales);

      const { result } = renderHook(() => useWeeklySales(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockWeeklySales);
    });
  });

  describe('useTopItemsToday', () => {
    it('should fetch top items with default limit', async () => {
      const mockTopItems = [
        { name: 'Caffe Mocha', sold: 12, rank: 1, menu_item_id: 'item1' },
        { name: 'Flat White', sold: 10, rank: 2, menu_item_id: 'item2' },
        { name: 'Iced Latte', sold: 9, rank: 3, menu_item_id: 'item3' },
      ];

      (dashboardService.fetchTopItemsToday as jest.Mock).mockResolvedValue(mockTopItems);

      const { result } = renderHook(() => useTopItemsToday(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockTopItems);
      expect(dashboardService.fetchTopItemsToday).toHaveBeenCalledWith(3);
    });

    it('should fetch top items with custom limit', async () => {
      const mockTopItems = [
        { name: 'Caffe Mocha', sold: 12, rank: 1, menu_item_id: 'item1' },
      ];

      (dashboardService.fetchTopItemsToday as jest.Mock).mockResolvedValue(mockTopItems);

      const { result } = renderHook(() => useTopItemsToday(5), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(dashboardService.fetchTopItemsToday).toHaveBeenCalledWith(5);
    });
  });
});

