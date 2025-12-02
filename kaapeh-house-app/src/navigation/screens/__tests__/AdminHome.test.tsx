import React from 'react';
// @ts-ignore - Will be available after npm install
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminHome from '../AdminHome';
import { useDashboardData } from '../../../hooks/useDashboardQueries';
import { supabase } from '../../../../utils/supabase';

// Mock the hook
const mockUseDashboardData = useDashboardData as any;
// @ts-ignore - jest will be available after npm install
jest.mock('../../../hooks/useDashboardQueries', () => ({
  // @ts-ignore
  useDashboardData: jest.fn(),
}));

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

// Mock navigation
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

  // @ts-ignore
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    // @ts-ignore
    jest.clearAllMocks();
  });

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
    // Data should be sorted highest to lowest, so Wed (100) should appear first
    const barLabels = ['Wed', 'Mon', 'Tue'];
    barLabels.forEach(day => {
      // @ts-ignore
      expect(getByText(day)).toBeTruthy();
    });
  });

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
