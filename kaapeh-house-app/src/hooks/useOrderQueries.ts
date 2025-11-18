import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchActiveOrders, Order } from '../services/orderService';

// Query keys
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: { customerId?: string }) => [...orderKeys.lists(), filters] as const,
  active: (customerId: string) => [...orderKeys.list({ customerId }), 'active'] as const,
};

// Hook to fetch active orders for a customer
export function useActiveOrders(customerId: string | undefined) {
  return useQuery({
    queryKey: orderKeys.active(customerId || ''),
    queryFn: () => fetchActiveOrders(customerId!),
    enabled: !!customerId, // Only fetch if customerId is provided
    staleTime: 30 * 1000, // 30 seconds - orders change frequently
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds for active orders
  });
}

// Hook to invalidate order queries
export function useInvalidateOrders() {
  const queryClient = useQueryClient();
  
  return {
    invalidateActive: (customerId: string) => 
      queryClient.invalidateQueries({ queryKey: orderKeys.active(customerId) }),
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: orderKeys.all }),
  };
}

