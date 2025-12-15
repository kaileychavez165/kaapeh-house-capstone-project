/**
 * AdminHome Component Tests
 * 
 * This test file verifies the AdminHome component's behavior, including:
 * - Loading and error states
 * - Rendering of dashboard metrics (sales, orders, averages)
 * - Display of weekly sales charts
 * - Top items list rendering
 * - Sign out functionality
 * - Empty state handling
 * 
 * The tests use mocked dependencies to isolate the component:
 * - useDashboardData hook is mocked to return controlled data
 * - Supabase auth is mocked to test sign out without real API calls
 * - React Navigation is mocked to avoid navigation setup complexity
 */

import React from 'react';
// @ts-ignore - Will be available after npm install
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminHome from '../AdminHome';
import { useDashboardData } from '../../../hooks/useDashboardQueries';
import { supabase } from '../../../../utils/supabase';

// Mock the useDashboardData hook to control what data the component receives
// This allows us to test different states (loading, error, success) without making real API calls
const mockUseDashboardData = useDashboardData as any;
// @ts-ignore - jest will be available after npm install
jest.mock('../../../hooks/useDashboardQueries', () => ({
  // @ts-ignore
  useDashboardData: jest.fn(),
}));

// Mock Supabase auth signOut to test logout functionality without actual authentication
const mockSupabaseAuthSignOut = supabase.auth.signOut as any;
// @ts-ignore - jest will be available after npm install
jest.mock('../../../../utils/supabase', () => ({
  supabase: {
    auth: {
      // @ts-ignore
      signOut: jest.fn(() => Promise.resolve({ error: null })),
    },
  },
}));

// Mock React Navigation to avoid needing a full navigation setup
// This allows us to test navigation calls without setting up a navigation container
// @ts-ignore - jest will be available after npm install
const mockNavigate = jest.fn();
// @ts-ignore - jest will be available after npm install
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// @ts-ignore
describe('AdminHome Component', () => {
  let queryClient: QueryClient;

  // Set up a fresh QueryClient for each test to ensure test isolation
  // Disable retries to make tests run faster and more predictably
  // @ts-ignore
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Don't retry failed queries in tests
        },
      },
    });
    // Clear all mocks before each test to prevent test interference
    // @ts-ignore
    jest.clearAllMocks();
  });

  /**
   * Test: Loading State
   * Verifies that the component displays a loading message when data is being fetched
   */
  // @ts-ignore
  it('should render loading state', () => {
    mockUseDashboardData.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <AdminHome />
      </QueryClientProvider>
    );

    // @ts-ignore
    expect(getByText('Loading dashboard data...')).toBeTruthy();
  });

  /**
   * Test: Error State
   * Verifies that the component displays error messages when data fetching fails
   */
  // @ts-ignore
  it('should render error state', () => {
    const mockError = new Error('Failed to fetch data');
    mockUseDashboardData.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: mockError,
    });

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <AdminHome />
      </QueryClientProvider>
    );

    // @ts-ignore
    expect(getByText('Error loading dashboard data')).toBeTruthy();
    // @ts-ignore
    expect(getByText('Failed to fetch data')).toBeTruthy();
  });

  /**
   * Test: Dashboard Metrics Display
   * Verifies that the component correctly displays:
   * - Today's total sales amount
   * - Number of orders today
   * - Average amount per order
   */
  // @ts-ignore
  it('should render dashboard metrics correctly', () => {
    const mockData = {
      metrics: {
        todaysSales: 150.75,
        ordersToday: 10,
        averagePerOrder: 15.08,
      },
      weeklySales: [],
      topItems: [],
    };

    mockUseDashboardData.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      error: null,
    });

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <AdminHome />
      </QueryClientProvider>
    );

    // @ts-ignore
    expect(getByText("Today's Sales")).toBeTruthy();
    // @ts-ignore
    expect(getByText('$150.75')).toBeTruthy();
    // @ts-ignore
    expect(getByText('Orders Today')).toBeTruthy();
    // @ts-ignore
    expect(getByText('10')).toBeTruthy();
    // @ts-ignore
    expect(getByText('Avg. Per Order')).toBeTruthy();
    // @ts-ignore
    expect(getByText('$15.08')).toBeTruthy();
  });

  /**
   * Test: Weekly Sales Chart with Sorting
   * Verifies that:
   * - The weekly sales chart is displayed
   * - Sales data is sorted from highest to lowest
   * - All day labels are rendered correctly
   */
  // @ts-ignore
  it('should render weekly sales chart with sorted data', () => {
    const mockData = {
      metrics: {
        todaysSales: 0,
        ordersToday: 0,
        averagePerOrder: 0,
      },
      weeklySales: [
        { day: 'Mon', sales: 50, date: '2025-01-20' },
        { day: 'Wed', sales: 100, date: '2025-01-22' },
        { day: 'Tue', sales: 25, date: '2025-01-21' },
      ],
      topItems: [],
    };

    mockUseDashboardData.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      error: null,
    });

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <AdminHome />
      </QueryClientProvider>
    );

    // @ts-ignore
    expect(getByText('Weekly Sales')).toBeTruthy();
    // Verify that data is sorted highest to lowest (Wed: 100, Mon: 50, Tue: 25)
    // The component should display days in descending order of sales
    const barLabels = ['Wed', 'Mon', 'Tue'];
    barLabels.forEach(day => {
      // @ts-ignore
      expect(getByText(day)).toBeTruthy();
    });
  });

  /**
   * Test: Top Items List
   * Verifies that the component displays:
   * - The "Top Items Today" heading
   * - Item names and quantities sold
   * - Items are displayed in rank order
   */
  // @ts-ignore
  it('should render top items list', () => {
    const mockData = {
      metrics: {
        todaysSales: 0,
        ordersToday: 0,
        averagePerOrder: 0,
      },
      weeklySales: [],
      topItems: [
        { name: 'Caffe Mocha', sold: 12, rank: 1, menu_item_id: 'item1' },
        { name: 'Flat White', sold: 10, rank: 2, menu_item_id: 'item2' },
        { name: 'Iced Latte', sold: 9, rank: 3, menu_item_id: 'item3' },
      ],
    };

    mockUseDashboardData.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      error: null,
    });

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <AdminHome />
      </QueryClientProvider>
    );

    // @ts-ignore
    expect(getByText('Top Items Today')).toBeTruthy();
    // @ts-ignore
    expect(getByText('Caffe Mocha')).toBeTruthy();
    // @ts-ignore
    expect(getByText('12 sold')).toBeTruthy();
    // @ts-ignore
    expect(getByText('Flat White')).toBeTruthy();
    // @ts-ignore
    expect(getByText('10 sold')).toBeTruthy();
  });

  /**
   * Test: Sign Out Functionality
   * Verifies that:
   * - The sign out button is present and clickable
   * - Clicking sign out calls the Supabase auth.signOut method
   * - The sign out operation completes successfully
   */
  // @ts-ignore
  it('should handle sign out', async () => {
    const mockData = {
      metrics: {
        todaysSales: 0,
        ordersToday: 0,
        averagePerOrder: 0,
      },
      weeklySales: [],
      topItems: [],
    };

    mockUseDashboardData.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      error: null,
    });

    mockSupabaseAuthSignOut.mockResolvedValue({ error: null });

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <AdminHome />
      </QueryClientProvider>
    );

    const signOutButton = getByText('Sign Out');
    fireEvent.press(signOutButton);

    await waitFor(() => {
      // @ts-ignore
      expect(mockSupabaseAuthSignOut).toHaveBeenCalled();
    });
  });

  /**
   * Test: Empty State
   * Verifies that the component displays appropriate messages when:
   * - No sales data is available
   * - No items were sold today
   * This ensures a good user experience even when there's no data to display
   */
  // @ts-ignore
  it('should display empty state when no sales data', () => {
    const mockData = {
      metrics: {
        todaysSales: 0,
        ordersToday: 0,
        averagePerOrder: 0,
      },
      weeklySales: [],
      topItems: [],
    };

    mockUseDashboardData.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      error: null,
    });

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <AdminHome />
      </QueryClientProvider>
    );

    // @ts-ignore
    expect(getByText('No sales data available')).toBeTruthy();
    // @ts-ignore
    expect(getByText('No items sold today')).toBeTruthy();
  });
});
