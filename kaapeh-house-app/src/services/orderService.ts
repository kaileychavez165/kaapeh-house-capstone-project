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
    // Fetch orders with order_items and join menu_items to get item names
    let { data: orders, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          order_id,
          menu_item_id,
          quantity,
          price_at_time,
          customizations,
          menu_items:menu_item_id (
            name,
            description
          )
        )
      `)
      .eq("customer_id", customerId)
      .in("status", ["pending", "preparing", "ready"])
      .order("created_at", { ascending: false });

    // If that fails, try without the relationship and fetch menu_items separately
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

      // If we got orders but no menu_item data, fetch menu_items separately
      if (orders && !error) {
        const menuItemIds = new Set<string>();
        orders.forEach((order: any) => {
          (order.order_items || []).forEach((item: any) => {
            if (item.menu_item_id) {
              menuItemIds.add(item.menu_item_id);
            }
          });
        });

        if (menuItemIds.size > 0) {
          const { data: menuItems } = await supabase
            .from("menu_items")
            .select("id, name, description")
            .in("id", Array.from(menuItemIds));

          // Map menu items by ID for quick lookup
          const menuItemsMap = new Map();
          (menuItems || []).forEach((item: any) => {
            menuItemsMap.set(item.id, { name: item.name, description: item.description });
          });

          // Attach menu_item data to order_items
          orders.forEach((order: any) => {
            order.order_items = (order.order_items || []).map((item: any) => ({
              ...item,
              menu_items: menuItemsMap.get(item.menu_item_id) || null,
            }));
          });
        }
      }
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

        // Extract customizations from JSONB field
        const customizations = item.customizations || {};
        const size = customizations.size;
        const temperature = customizations.temperature;

        return {
          id: item.id,
          order_id: item.order_id,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity || 1,
          size: size,
          temperature: temperature,
          price: parseFloat(item.price_at_time || item.price || 0),
          customizations: customizations,
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

// Create a new order with order items
export interface CreateOrderItem {
  menu_item_id: string;
  quantity: number;
  price_at_time: number;
  customizations?: {
    size?: string;
    temperature?: string;
    [key: string]: any; // For other customizations like milk, syrup, etc.
  };
}

export interface CreateOrderParams {
  customer_id: string;
  cart_items: CreateOrderItem[];
  total_amount: number;
  special_instructions?: string;
}

export const createOrder = async (params: CreateOrderParams): Promise<Order> => {
  try {
    // First, create the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: params.customer_id,
        total_amount: params.total_amount,
        special_instructions: params.special_instructions || null,
        status: "pending",
        customer_status: "not_started",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      throw orderError;
    }

    if (!order) {
      throw new Error("Failed to create order");
    }

    // Then, create all order items
    const orderItems = params.cart_items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      price_at_time: item.price_at_time,
      customizations: item.customizations || null,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      // Try to clean up the order if items creation fails
      await supabase.from("orders").delete().eq("id", order.id);
      throw itemsError;
    }

    // Fetch the complete order with items and menu_item names
    const { data: completeOrder, error: fetchError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          order_id,
          menu_item_id,
          quantity,
          price_at_time,
          customizations,
          menu_items:menu_item_id (
            name,
            description
          )
        )
      `)
      .eq("id", order.id)
      .single();

    if (fetchError) {
      console.error("Error fetching complete order:", fetchError);
      // Return the order we created even if fetch fails
      return {
        id: order.id,
        customer_id: order.customer_id,
        order_number: order.id.slice(-4),
        status: order.status,
        total: parseFloat(order.total_amount),
        customer_status: order.customer_status,
        created_at: order.created_at,
        order_items: [],
      };
    }

    // Transform to match Order interface
    return {
      id: completeOrder.id,
      customer_id: completeOrder.customer_id,
      order_number: completeOrder.id.slice(-4),
      status: completeOrder.status,
      total: parseFloat(completeOrder.total_amount),
      customer_status: completeOrder.customer_status,
      created_at: completeOrder.created_at,
      order_items: (completeOrder.order_items || []).map((item: any) => {
        // Extract customizations from JSONB field
        const customizations = item.customizations || {};
        const size = customizations.size;
        const temperature = customizations.temperature;

        // Handle menu_item data
        let menuItem = null;
        if (item.menu_items) {
          menuItem = Array.isArray(item.menu_items) ? item.menu_items[0] : item.menu_items;
        }

        return {
          id: item.id,
          order_id: item.order_id,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          size: size,
          temperature: temperature,
          price: parseFloat(item.price_at_time),
          customizations: customizations,
          menu_item: menuItem,
        };
      }),
    };
  } catch (error) {
    console.error("Error in createOrder:", error);
    throw error;
  }
};

// Fetch past orders (completed and cancelled) for a customer
export const fetchPastOrders = async (customerId: string): Promise<Order[]> => {
  try {
    // Fetch orders with order_items and join menu_items to get item names
    let { data: orders, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          order_id,
          menu_item_id,
          quantity,
          price_at_time,
          customizations,
          menu_items:menu_item_id (
            name,
            description
          )
        )
      `)
      .eq("customer_id", customerId)
      .in("status", ["completed", "cancelled"])
      .order("created_at", { ascending: false });

    // If that fails, try without the relationship and fetch menu_items separately
    if (error) {
      console.log("Attempting alternative query structure...");
      const result = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .eq("customer_id", customerId)
        .in("status", ["completed", "cancelled"])
        .order("created_at", { ascending: false });
      
      orders = result.data;
      error = result.error;

      // If we got orders but no menu_item data, fetch menu_items separately
      if (orders && !error) {
        const menuItemIds = new Set<string>();
        orders.forEach((order: any) => {
          (order.order_items || []).forEach((item: any) => {
            if (item.menu_item_id) {
              menuItemIds.add(item.menu_item_id);
            }
          });
        });

        if (menuItemIds.size > 0) {
          const { data: menuItems } = await supabase
            .from("menu_items")
            .select("id, name, description")
            .in("id", Array.from(menuItemIds));

          // Map menu items by ID for quick lookup
          const menuItemsMap = new Map();
          (menuItems || []).forEach((item: any) => {
            menuItemsMap.set(item.id, { name: item.name, description: item.description });
          });

          // Attach menu_item data to order_items
          orders.forEach((order: any) => {
            order.order_items = (order.order_items || []).map((item: any) => ({
              ...item,
              menu_items: menuItemsMap.get(item.menu_item_id) || null,
            }));
          });
        }
      }
    }

    if (error) {
      console.error("Error fetching past orders:", error);
      throw error;
    }

    // Transform the data to match our interface
    const transformedOrders: Order[] = (orders || []).map((order: any) => ({
      id: order.id,
      customer_id: order.customer_id,
      order_number: order.order_number || order.order_id || `#${order.id.slice(-4)}`,
      status: order.status || "completed",
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

        // Extract customizations from JSONB field
        const customizations = item.customizations || {};
        const size = customizations.size;
        const temperature = customizations.temperature;

        return {
          id: item.id,
          order_id: item.order_id,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity || 1,
          size: size,
          temperature: temperature,
          price: parseFloat(item.price_at_time || item.price || 0),
          customizations: customizations,
          menu_item: menuItem,
        };
      }),
    }));

    return transformedOrders;
  } catch (error) {
    console.error("Error in fetchPastOrders:", error);
    throw error;
  }
};

// Cancel an order (update status to cancelled)
export const cancelOrder = async (orderId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId);

    if (error) {
      console.error("Error cancelling order:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in cancelOrder:", error);
    throw error;
  }
};

// Update customer status for an order
export const updateCustomerStatus = async (
  orderId: string,
  customerStatus: "not_started" | "on_the_way" | "arrived"
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

