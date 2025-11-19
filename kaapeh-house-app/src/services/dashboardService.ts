import { supabase } from '../../utils/supabase';

export interface DashboardMetrics {
  todaysSales: number;
  ordersToday: number;
  averagePerOrder: number;
}

export interface WeeklySalesData {
  day: string;
  sales: number;
  date: string;
}

export interface TopItem {
  name: string;
  sold: number;
  rank: number;
  menu_item_id: string;
}

// Get start and end of today in ISO format
const getTodayRange = () => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return {
    start: startOfDay.toISOString(),
    end: endOfDay.toISOString(),
  };
};

// Get start and end of a specific day
const getDayRange = (date: Date) => {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return {
    start: startOfDay.toISOString(),
    end: endOfDay.toISOString(),
  };
};

// Fetch today's metrics (sales, orders, average)
export const fetchTodaysMetrics = async (): Promise<DashboardMetrics> => {
  try {
    const { start, end } = getTodayRange();

    // Fetch only completed orders created today
    const { data: orders, error } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('status', 'completed')
      .gte('created_at', start)
      .lte('created_at', end);

    if (error) {
      console.error('Error fetching today\'s orders:', error);
      throw error;
    }

    const ordersToday = orders?.length || 0;
    const todaysSales = orders?.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0) || 0;
    const averagePerOrder = ordersToday > 0 ? todaysSales / ordersToday : 0;

    return {
      todaysSales: Math.round(todaysSales * 100) / 100, // Round to 2 decimal places
      ordersToday,
      averagePerOrder: Math.round(averagePerOrder * 100) / 100,
    };
  } catch (error) {
    console.error('Error in fetchTodaysMetrics:', error);
    throw error;
  }
};

// Fetch weekly sales data (last 7 days)
export const fetchWeeklySales = async (): Promise<WeeklySalesData[]> => {
  try {
    const now = new Date();
    const weeklyData: WeeklySalesData[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Get data for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const { start, end } = getDayRange(date);

      const { data: orders, error } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'completed')
        .gte('created_at', start)
        .lte('created_at', end);

      if (error) {
        console.error(`Error fetching sales for ${date.toISOString()}:`, error);
        // Continue with 0 sales for this day
        weeklyData.push({
          day: dayNames[date.getDay()],
          sales: 0,
          date: date.toISOString().split('T')[0],
        });
        continue;
      }

      const sales = orders?.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0) || 0;
      weeklyData.push({
        day: dayNames[date.getDay()],
        sales: Math.round(sales * 100) / 100,
        date: date.toISOString().split('T')[0],
      });
    }

    return weeklyData;
  } catch (error) {
    console.error('Error in fetchWeeklySales:', error);
    throw error;
  }
};

// Fetch top items sold today
export const fetchTopItemsToday = async (limit: number = 3): Promise<TopItem[]> => {
  try {
    const { start, end } = getTodayRange();

    // First, get only completed orders from today
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('status', 'completed')
      .gte('created_at', start)
      .lte('created_at', end);

    if (ordersError) {
      console.error('Error fetching today\'s orders:', ordersError);
      throw ordersError;
    }

    if (!orders || orders.length === 0) {
      return [];
    }

    const orderIds = orders.map(order => order.id);

    // Fetch order_items for today's orders
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('menu_item_id, quantity')
      .in('order_id', orderIds);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      throw itemsError;
    }

    if (!orderItems || orderItems.length === 0) {
      return [];
    }

    // Aggregate quantities by menu_item_id
    const itemCounts = new Map<string, number>();
    orderItems.forEach(item => {
      const currentCount = itemCounts.get(item.menu_item_id) || 0;
      itemCounts.set(item.menu_item_id, currentCount + (item.quantity || 1));
    });

    // Get menu item names
    const menuItemIds = Array.from(itemCounts.keys());
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, name')
      .in('id', menuItemIds);

    if (menuError) {
      console.error('Error fetching menu items:', menuError);
      throw menuError;
    }

    // Create a map of menu_item_id to name
    const menuItemsMap = new Map<string, string>();
    menuItems?.forEach(item => {
      menuItemsMap.set(item.id, item.name);
    });

    // Convert to array and sort by quantity sold
    const topItems: TopItem[] = Array.from(itemCounts.entries())
      .map(([menu_item_id, sold]) => ({
        menu_item_id,
        name: menuItemsMap.get(menu_item_id) || 'Unknown Item',
        sold,
        rank: 0, // Will be set after sorting
      }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, limit)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

    return topItems;
  } catch (error) {
    console.error('Error in fetchTopItemsToday:', error);
    throw error;
  }
};

// Fetch all dashboard data at once
export const fetchDashboardData = async () => {
  try {
    const [metrics, weeklySales, topItems] = await Promise.all([
      fetchTodaysMetrics(),
      fetchWeeklySales(),
      fetchTopItemsToday(3),
    ]);

    return {
      metrics,
      weeklySales,
      topItems,
    };
  } catch (error) {
    console.error('Error in fetchDashboardData:', error);
    throw error;
  }
};

