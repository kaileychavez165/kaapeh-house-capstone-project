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

// Mock Supabase
jest.mock('../../../utils/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('Dashboard Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchTodaysMetrics', () => {
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

  describe('fetchWeeklySales', () => {
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
      // First day should have 0 sales due to error
      expect(result[0].sales).toBe(0);
    });
  });

  describe('fetchTopItemsToday', () => {
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
      expect(result[0].name).toBe('Caffe Mocha');
      expect(result[0].sold).toBe(7); // 5 + 2
      expect(result[0].rank).toBe(1);
      expect(result[1].name).toBe('Flat White');
      expect(result[1].sold).toBe(3);
      expect(result[1].rank).toBe(2);
    });

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

  describe('fetchDashboardData', () => {
    it('should fetch all dashboard data in parallel', async () => {
      const mockMetrics = {
        todaysSales: 100,
        ordersToday: 5,
        averagePerOrder: 20,
      };
      const mockWeeklySales: WeeklySalesData[] = [
        { day: 'Mon', sales: 50, date: '2025-01-20' },
      ];
      const mockTopItems: TopItem[] = [
        { name: 'Caffe Mocha', sold: 10, rank: 1, menu_item_id: 'item1' },
      ];

      // Mock all three functions
      jest.spyOn(require('../dashboardService'), 'fetchTodaysMetrics')
        .mockResolvedValue(mockMetrics);
      jest.spyOn(require('../dashboardService'), 'fetchWeeklySales')
        .mockResolvedValue(mockWeeklySales);
      jest.spyOn(require('../dashboardService'), 'fetchTopItemsToday')
        .mockResolvedValue(mockTopItems);

      const result = await fetchDashboardData();

      expect(result).toEqual({
        metrics: mockMetrics,
        weeklySales: mockWeeklySales,
        topItems: mockTopItems,
      });
    });
  });
});

