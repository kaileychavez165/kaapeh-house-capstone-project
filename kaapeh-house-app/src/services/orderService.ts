import { supabase } from "../../utils/supabase";

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  size?: string;
  temperature?: string;
  price: number;
  customizations?: Record<string, any>;
  menu_item?: {
    name: string;
    description?: string;
  };
}

export interface Order {
  id: string;
  customer_id: string;
  order_number: string;
  status: string;
  total: number;
  estimated_time?: string;
  location?: string;
  customer_status?: string;
  created_at: string;
  order_items?: OrderItem[];
}

// Fetch active orders for a customer
export const fetchActiveOrders = async (customerId: string): Promise<Order[]> => {
  try {
    // First, try to fetch with menu_items relationship
    let { data: orders, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          order_id,
          menu_item_id,
          quantity,
          size,
          temperature,
          price,
          menu_items:menu_item_id (
            name,
            description
          )
        )
      `)
      .eq("customer_id", customerId)
      .in("status", ["pending", "preparing", "ready"])
      .order("created_at", { ascending: false });

    // If that fails, try without the relationship
    if (error) {
      console.log("Attempting alternative query structure...");
      const result = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .eq("customer_id", customerId)
        .in("status", ["pending", "preparing", "ready"])
        .order("created_at", { ascending: false });
      
      orders = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Error fetching active orders:", error);
      throw error;
    }

    // Transform the data to match our interface
    const transformedOrders: Order[] = (orders || []).map((order: any) => ({
      id: order.id,
      customer_id: order.customer_id,
      order_number: order.order_number || order.order_id || `#${order.id.slice(-4)}`,
      status: order.status || "pending",
      total: order.total || order.total_amount || 0,
      estimated_time: order.estimated_time || order.estimated_time_minutes,
      location: order.location || order.store_location || "Main Street Cafe",
      customer_status: order.customer_status,
      created_at: order.created_at,
      order_items: (order.order_items || []).map((item: any) => {
        // Handle different possible structures for menu_item data
        let menuItem = null;
        if (item.menu_items) {
          menuItem = Array.isArray(item.menu_items) ? item.menu_items[0] : item.menu_items;
        } else if (item.menu_item_name) {
          menuItem = { name: item.menu_item_name, description: item.menu_item_description };
        } else if (item.name) {
          menuItem = { name: item.name, description: item.description };
        }

        return {
          id: item.id,
          order_id: item.order_id,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity || 1,
          size: item.size,
          temperature: item.temperature,
          price: item.price || item.item_price || 0,
          menu_item: menuItem,
        };
      }),
    }));

    return transformedOrders;
  } catch (error) {
    console.error("Error in fetchActiveOrders:", error);
    throw error;
  }
};

// Update customer status for an order
export const updateCustomerStatus = async (
  orderId: string,
  customerStatus: "not_left" | "on_way" | "at_store"
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("orders")
      .update({ customer_status: customerStatus })
      .eq("id", orderId);

    if (error) {
      console.error("Error updating customer status:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in updateCustomerStatus:", error);
    throw error;
  }
};

