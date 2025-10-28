import { supabase } from "../../utils/supabase";

export interface CustomerSummary {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  ordersCount: number;
}

// Fetch customers from profiles and compute number of orders per customer
export const fetchCustomerSummaries = async (): Promise<CustomerSummary[]> => {
  try {
    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, created_at")
      .eq("role", "customer")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    const profileIds = (profiles || []).map((p) => p.id);

    if (profileIds.length === 0) {
      return [];
    }

    // Fetch orders customer_id list
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("customer_id");

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      throw ordersError;
    }

    const ordersCountByCustomer: Record<string, number> = {};
    (orders || []).forEach((o) => {
      const key = o.customer_id as string;
      ordersCountByCustomer[key] = (ordersCountByCustomer[key] || 0) + 1;
    });

    // Merge
    const result: CustomerSummary[] = (profiles || []).map((p) => ({
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      created_at: p.created_at,
      ordersCount: ordersCountByCustomer[p.id] || 0,
    }));

    return result;
  } catch (error) {
    console.error("Error in fetchCustomerSummaries:", error);
    throw error;
  }
};


