import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchUserProfile, UserProfile } from '../services/userService';

// Query keys
export const userKeys = {
  all: ['users'] as const,
  profiles: () => [...userKeys.all, 'profile'] as const,
  profile: (userId: string) => [...userKeys.profiles(), userId] as const,
};

// Hook to fetch user profile
export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: userKeys.profile(userId || ''),
    queryFn: () => fetchUserProfile(userId!),
    enabled: !!userId, // Only fetch if userId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}

// Hook to invalidate user queries
export function useInvalidateUser() {
  const queryClient = useQueryClient();
  
  return {
    invalidateProfile: (userId: string) => 
      queryClient.invalidateQueries({ queryKey: userKeys.profile(userId) }),
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  };
}

