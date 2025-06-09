import { api } from '../utils'
import { useQuery } from '@tanstack/react-query'

export const useGetUserProfile = (username: string, enabled: boolean = true) => {
  const { data, isPending, error } = useQuery({
    queryKey: ['user-profile', username],
    queryFn: async () => {
      const res = await api.users[':username'].$get({
        param: { username }
      })
      if (!res.ok) {
        throw new Error('Failed to fetch user profile', { cause: res.status })
      }
      return res.json()
    },
    enabled: !!username && enabled,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      if (error instanceof Error && error.cause === 404) {
        return false
      }
      return failureCount < 3
    }
  })

  return { data, isPending, error }
}