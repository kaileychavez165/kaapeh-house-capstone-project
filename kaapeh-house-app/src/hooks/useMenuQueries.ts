import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMenuItems, fetchMenuItemsByCategory, fetchMenuCategories, searchMenuItems, MenuItem } from '../services/menuService';

// Query keys
export const menuKeys = {
  all: ['menu'] as const,
  lists: () => [...menuKeys.all, 'list'] as const,
  list: (filters: { excludeAdminCategories?: boolean; category?: string; searchQuery?: string }) => 
    [...menuKeys.lists(), filters] as const,
  categories: () => [...menuKeys.all, 'categories'] as const,
};

// Hook to fetch all menu items
export function useMenuItems(excludeAdminCategories: boolean = false) {
  return useQuery({
    queryKey: menuKeys.list({ excludeAdminCategories }),
    queryFn: () => fetchMenuItems(excludeAdminCategories),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

// Hook to fetch menu items by category
export function useMenuItemsByCategory(category: string, excludeAdminCategories: boolean = false) {
  return useQuery({
    queryKey: menuKeys.list({ category, excludeAdminCategories }),
    queryFn: () => fetchMenuItemsByCategory(category, excludeAdminCategories),
    enabled: !!category && category !== 'All Items', // Only fetch if category is provided and not "All Items"
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Hook to fetch menu categories
export function useMenuCategories() {
  return useQuery({
    queryKey: menuKeys.categories(),
    queryFn: () => fetchMenuCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes - categories don't change often
    gcTime: 30 * 60 * 1000,
  });
}

// Hook to search menu items
export function useSearchMenuItems(searchQuery: string, excludeAdminCategories: boolean = false) {
  return useQuery({
    queryKey: menuKeys.list({ searchQuery, excludeAdminCategories }),
    queryFn: () => searchMenuItems(searchQuery, excludeAdminCategories),
    enabled: searchQuery.trim().length > 0, // Only search if there's a query
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    gcTime: 5 * 60 * 1000,
  });
}

// Hook to invalidate menu queries (useful after mutations)
export function useInvalidateMenu() {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: menuKeys.all }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: menuKeys.lists() }),
    invalidateCategories: () => queryClient.invalidateQueries({ queryKey: menuKeys.categories() }),
  };
}

