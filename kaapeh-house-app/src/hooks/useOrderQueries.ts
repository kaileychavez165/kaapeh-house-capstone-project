import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchActiveOrders, fetchPastOrders, fetchAdminPendingOrders, fetchAdminPastOrders, Order } from '../services/orderService';

// Query keys
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: { customerId?: string }) => [...orderKeys.lists(), filters] as const,
  active: (customerId: string) => [...orderKeys.list({ customerId }), 'active'] as const,
  past: (customerId: string) => [...orderKeys.list({ customerId }), 'past'] as const,
  admin: () => [...orderKeys.all, 'admin'] as const,
  adminPending: () => [...orderKeys.admin(), 'pending'] as const,
  adminPast: () => [...orderKeys.admin(), 'past'] as const,
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

// Hook to fetch past orders for a customer
export function usePastOrders(customerId: string | undefined) {
  return useQuery({
    queryKey: orderKeys.past(customerId || ''),
    queryFn: () => fetchPastOrders(customerId!),
    enabled: !!customerId, // Only fetch if customerId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes - past orders don't change often
    gcTime: 10 * 60 * 1000,
  });
}

// Hook to fetch pending orders for admin
export function useAdminPendingOrders() {
  return useQuery({
    queryKey: orderKeys.adminPending(),
    queryFn: () => fetchAdminPendingOrders(),
    staleTime: 30 * 1000, // 30 seconds - pending orders change frequently
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds for pending orders
  });
}

// Hook to fetch past orders for admin
export function useAdminPastOrders() {
  return useQuery({
    queryKey: orderKeys.adminPast(),
    queryFn: () => fetchAdminPastOrders(),
    staleTime: 5 * 60 * 1000, // 5 minutes - past orders don't change often
    gcTime: 10 * 60 * 1000,
  });
}

// Hook to invalidate order queries
export function useInvalidateOrders() {
  const queryClient = useQueryClient();
  
  return {
    invalidateActive: (customerId: string) => 
      queryClient.invalidateQueries({ queryKey: orderKeys.active(customerId) }),
    invalidatePast: (customerId: string) => 
      queryClient.invalidateQueries({ queryKey: orderKeys.past(customerId) }),
    invalidateAdminPending: () => 
      queryClient.invalidateQueries({ queryKey: orderKeys.adminPending() }),
    invalidateAdminPast: () => 
      queryClient.invalidateQueries({ queryKey: orderKeys.adminPast() }),
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: orderKeys.all }),
  };
}

