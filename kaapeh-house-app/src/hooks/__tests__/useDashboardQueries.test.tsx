/**
 * Dashboard Hooks Tests
 * 
 * This test file verifies the React Query hooks that fetch dashboard data:
 * - useDashboardData: Fetches all dashboard data (metrics, weekly sales, top items)
 * - useTodaysMetrics: Fetches today's sales metrics
 * - useWeeklySales: Fetches weekly sales data
 * - useTopItemsToday: Fetches top-selling items for today
 * 
 * These tests use the real React Query implementation to verify:
 * - Loading states are correctly managed
 * - Data is properly fetched and returned
 * - Errors are handled correctly
 * - Query options (like limits) are passed correctly
 * 
 * The dashboard service is mocked to avoid real API calls while testing hook behavior.
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardData, useTodaysMetrics, useWeeklySales, useTopItemsToday } from '../useDashboardQueries';
import * as dashboardService from '../../services/dashboardService';

// Mock the dashboard service to control what data is returned
// This allows us to test hook behavior without making real API calls
jest.mock('../../services/dashboardService');

// Unmock React Query - we need the real implementation to test hook behavior
// This ensures we're testing how the hooks actually work with React Query
jest.unmock('@tanstack/react-query');

describe('Dashboard Hooks', () => {
  let queryClient: QueryClient;

  // Set up a fresh QueryClient for each test to ensure test isolation
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retries for faster, more predictable tests
        },
      },
    });
    jest.clearAllMocks(); // Clear all mocks before each test
  });

  // Wrapper component to provide QueryClient context to hooks
  // React Query hooks require a QueryClientProvider to work
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  /**
   * Tests for useDashboardData hook
   * This hook fetches all dashboard data in parallel (metrics, weekly sales, top items)
   */
  describe('useDashboardData', () => {
    /**
     * Test: Successful Data Fetch
     * Verifies that:
     * - The hook starts in a loading state
     * - Data is fetched successfully
     * - The hook transitions from loading to loaded state
     * - The returned data matches the expected structure
     */
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

    /**
     * Test: Error Handling
     * Verifies that:
     * - The hook correctly handles errors from the service
     * - The error state is set when fetching fails
     * - The error object is accessible for error display
     */
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

  /**
   * Tests for useTodaysMetrics hook
   * This hook fetches today's sales metrics (total sales, order count, average per order)
   */
  describe('useTodaysMetrics', () => {
    /**
     * Test: Fetch Today's Metrics
     * Verifies that the hook successfully fetches and returns today's sales metrics
     */
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

  /**
   * Tests for useWeeklySales hook
   * This hook fetches sales data for the last 7 days
   */
  describe('useWeeklySales', () => {
    /**
     * Test: Fetch Weekly Sales Data
     * Verifies that the hook successfully fetches and returns weekly sales data
     */
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

  /**
   * Tests for useTopItemsToday hook
   * This hook fetches the top-selling items for today, with an optional limit
   */
  describe('useTopItemsToday', () => {
    /**
     * Test: Fetch with Default Limit
     * Verifies that:
     * - The hook uses a default limit (3) when no limit is specified
     * - Top items are fetched and returned correctly
     */
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

    /**
     * Test: Fetch with Custom Limit
     * Verifies that:
     * - The hook accepts a custom limit parameter
     * - The limit is passed correctly to the service function
     */
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

