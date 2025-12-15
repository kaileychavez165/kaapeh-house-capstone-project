/**
 * Dashboard Service Tests
 * 
 * This test file verifies the dashboard service functions that interact with Supabase:
 * - fetchTodaysMetrics: Calculates today's sales metrics from completed orders
 * - fetchWeeklySales: Fetches sales data for the last 7 days
 * - fetchTopItemsToday: Fetches and ranks top-selling items for today
 * - fetchDashboardData: Fetches all dashboard data in parallel
 * 
 * These tests mock Supabase queries to:
 * - Test business logic without real database calls
 * - Verify correct query construction (filters, date ranges, etc.)
 * - Test error handling and edge cases (empty data, errors)
 * - Ensure calculations are correct (totals, averages, rankings)
 */

import {
  fetchTodaysMetrics,
  fetchWeeklySales,
  fetchTopItemsToday,
  fetchDashboardData,
  DashboardMetrics,
  WeeklySalesData,
  TopItem,
} from '../dashboardService';
import { supabase } from '../../../utils/supabase';

// Mock Supabase to avoid real database calls
// We'll construct mock query builders that return controlled data
jest.mock('../../../utils/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('Dashboard Service', () => {
  // Clear all mocks before each test to ensure test isolation
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Tests for fetchTodaysMetrics function
   * This function queries completed orders from today and calculates:
   * - Total sales (sum of all order amounts)
   * - Number of orders
   * - Average amount per order
   */
  describe('fetchTodaysMetrics', () => {
    /**
     * Test: Correct Calculation of Today's Metrics
     * Verifies that:
     * - Orders are filtered by status='completed' and today's date
     * - Total sales is the sum of all order amounts
     * - Order count is correct
     * - Average per order is calculated correctly (total / count)
     */
    it('should calculate today\'s metrics correctly', async () => {
      const mockOrders = [
        { total_amount: '25.50' },
        { total_amount: '15.75' },
        { total_amount: '30.00' },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: mockOrders,
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await fetchTodaysMetrics();

      expect(result).toEqual({
        todaysSales: 71.25,
        ordersToday: 3,
        averagePerOrder: 23.75,
      });
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'completed');
    });

    /**
     * Test: Zero Values for No Orders
     * Verifies that the function returns zero values when there are no orders today
     * This ensures the UI displays correctly even with no data
     */
    it('should return zero values when no orders exist', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await fetchTodaysMetrics();

      expect(result).toEqual({
        todaysSales: 0,
        ordersToday: 0,
        averagePerOrder: 0,
      });
    });

    /**
     * Test: Error Handling
     * Verifies that database errors are properly propagated
     * The function should throw errors so the UI can handle them appropriately
     */
    it('should handle errors gracefully', async () => {
      const mockError = { message: 'Database error', code: 'PGRST116' };
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      await expect(fetchTodaysMetrics()).rejects.toEqual(mockError);
    });

    /**
     * Test: Filter by Completed Status
     * Verifies that only orders with status='completed' are included in calculations
     * Pending or cancelled orders should not affect today's metrics
     */
    it('should only count completed orders', async () => {
      const mockOrders = [
        { total_amount: '25.50' },
        { total_amount: '15.75' },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: mockOrders,
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      await fetchTodaysMetrics();

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'completed');
    });
  });

  /**
   * Tests for fetchWeeklySales function
   * This function queries completed orders for each of the last 7 days
   * and returns sales totals for each day
   */
  describe('fetchWeeklySales', () => {
    /**
     * Test: Fetch Last 7 Days of Sales
     * Verifies that:
     * - The function returns data for exactly 7 days
     * - Each day has the required properties (day, sales, date)
     * - Only completed orders are included
     */
    it('should fetch sales for the last 7 days', async () => {
      const mockOrders = [
        { total_amount: '50.00' },
        { total_amount: '30.00' },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: mockOrders,
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await fetchWeeklySales();

      expect(result).toHaveLength(7);
      expect(result[0]).toHaveProperty('day');
      expect(result[0]).toHaveProperty('sales');
      expect(result[0]).toHaveProperty('date');
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'completed');
    });

    /**
     * Test: Error Handling for Individual Days
     * Verifies that if one day's query fails, the function:
     * - Still returns data for all 7 days
     * - Sets sales to 0 for days that had errors
     * - Doesn't fail completely if one day has an error
     */
    it('should handle errors for individual days gracefully', async () => {
      let callCount = 0;
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({
              data: null,
              error: { message: 'Error' },
            });
          }
          return Promise.resolve({
            data: [{ total_amount: '25.00' }],
            error: null,
          });
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await fetchWeeklySales();

      expect(result).toHaveLength(7);
      // First day should have 0 sales due to error - function should handle gracefully
      expect(result[0].sales).toBe(0);
    });
  });

  /**
   * Tests for fetchTopItemsToday function
   * This function:
   * 1. Finds all completed orders from today
   * 2. Gets all order items from those orders
   * 3. Aggregates quantities by menu item
   * 4. Fetches menu item names
   * 5. Returns top items sorted by quantity sold, with ranks
   */
  describe('fetchTopItemsToday', () => {
    /**
     * Test: Top Items Sorted by Quantity
     * Verifies that:
     * - Items are sorted by total quantity sold (highest first)
     * - Quantities are correctly aggregated across multiple orders
     * - Ranks are assigned correctly (1, 2, 3, etc.)
     * - Menu item names are correctly matched to IDs
     */
    it('should return top items sorted by quantity sold', async () => {
      const mockOrders = [{ id: 'order1' }, { id: 'order2' }];
      const mockOrderItems = [
        { menu_item_id: 'item1', quantity: 5 },
        { menu_item_id: 'item2', quantity: 3 },
        { menu_item_id: 'item1', quantity: 2 },
      ];
      const mockMenuItems = [
        { id: 'item1', name: 'Caffe Mocha' },
        { id: 'item2', name: 'Flat White' },
      ];

      const ordersQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: mockOrders,
          error: null,
        }),
      };

      const orderItemsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: mockOrderItems,
          error: null,
        }),
      };

      const menuItemsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: mockMenuItems,
          error: null,
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(ordersQuery)
        .mockReturnValueOnce(orderItemsQuery)
        .mockReturnValueOnce(menuItemsQuery);

      const result = await fetchTopItemsToday(3);

      expect(result).toHaveLength(2);
      // Verify Caffe Mocha is first (7 total: 5 + 2 from two orders)
      expect(result[0].name).toBe('Caffe Mocha');
      expect(result[0].sold).toBe(7); // Aggregated: 5 + 2
      expect(result[0].rank).toBe(1);
      // Verify Flat White is second (3 total)
      expect(result[1].name).toBe('Flat White');
      expect(result[1].sold).toBe(3);
      expect(result[1].rank).toBe(2);
    });

    /**
     * Test: Empty Array for No Orders
     * Verifies that the function returns an empty array when there are no orders today
     */
    it('should return empty array when no orders exist', async () => {
      const ordersQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(ordersQuery);

      const result = await fetchTopItemsToday(3);

      expect(result).toEqual([]);
    });

    /**
     * Test: Result Limiting
     * Verifies that the function respects the limit parameter
     * Even if there are more items, only the top N (by quantity) should be returned
     */
    it('should limit results to specified limit', async () => {
      const mockOrders = [{ id: 'order1' }];
      const mockOrderItems = Array.from({ length: 10 }, (_, i) => ({
        menu_item_id: `item${i}`,
        quantity: 1,
      }));
      const mockMenuItems = Array.from({ length: 10 }, (_, i) => ({
        id: `item${i}`,
        name: `Item ${i}`,
      }));

      const ordersQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: mockOrders,
          error: null,
        }),
      };

      const orderItemsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: mockOrderItems,
          error: null,
        }),
      };

      const menuItemsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: mockMenuItems,
          error: null,
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(ordersQuery)
        .mockReturnValueOnce(orderItemsQuery)
        .mockReturnValueOnce(menuItemsQuery);

      const result = await fetchTopItemsToday(3);

      expect(result).toHaveLength(3);
    });
  });

  /**
   * Tests for fetchDashboardData function
   * This function calls fetchTodaysMetrics, fetchWeeklySales, and fetchTopItemsToday
   * in parallel and combines their results into a single dashboard data object
   */
  describe('fetchDashboardData', () => {
    /**
     * Test: Fetch All Dashboard Data in Parallel
     * Verifies that:
     * - All three data sources are fetched (metrics, weekly sales, top items)
     * - The returned object has the correct structure
     * - All required properties are present
     * 
     * Note: Since fetchDashboardData calls the other functions internally,
     * we mock Supabase to return data that those functions expect
     */
    it('should fetch all dashboard data in parallel', async () => {
      const mockOrders = [
        { id: 'order1', total_amount: '20.00' },
        { id: 'order2', total_amount: '30.00' },
        { id: 'order3', total_amount: '25.00' },
        { id: 'order4', total_amount: '15.00' },
        { id: 'order5', total_amount: '10.00' },
      ];

      const mockOrderItems = [
        { menu_item_id: 'item1', quantity: 10 },
        { menu_item_id: 'item2', quantity: 5 },
      ];

      const mockMenuItems = [
        { id: 'item1', name: 'Caffe Mocha' },
        { id: 'item2', name: 'Latte' },
      ];

      // Create a flexible query builder that supports all Supabase query methods
      // This allows us to mock different query chains (select().eq().gte().lte() or select().in())
      const createQueryBuilder = (finalData: any, finalMethod: 'lte' | 'in' = 'lte') => {
        const builder: any = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
        };
        
        // The final method in the chain resolves with the mock data
        builder[finalMethod] = jest.fn().mockResolvedValue({
          data: finalData,
          error: null,
        });
        
        return builder;
      };

      // Mock supabase.from to return appropriate query builders based on table name
      // Different tables need different data structures:
      // - 'orders': needs order data with total_amount
      // - 'order_items': needs order item data with menu_item_id and quantity
      // - 'menu_items': needs menu item data with id and name
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'orders') {
          return createQueryBuilder(mockOrders, 'lte');
        } else if (table === 'order_items') {
          return createQueryBuilder(mockOrderItems, 'in');
        } else if (table === 'menu_items') {
          return createQueryBuilder(mockMenuItems, 'in');
        }
        return createQueryBuilder([], 'lte');
      });

      const result = await fetchDashboardData();

      // Verify the structure matches the expected dashboard data format
      // The result should contain metrics, weeklySales array, and topItems array
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('weeklySales');
      expect(result).toHaveProperty('topItems');
      expect(Array.isArray(result.weeklySales)).toBe(true);
      expect(Array.isArray(result.topItems)).toBe(true);
      // Verify metrics object has all required properties
      expect(result.metrics).toHaveProperty('todaysSales');
      expect(result.metrics).toHaveProperty('ordersToday');
      expect(result.metrics).toHaveProperty('averagePerOrder');
    });
  });
});

