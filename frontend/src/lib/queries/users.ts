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
        throw new Error('Failed to fetch user profile')
      }
      return res.json()
    },
    enabled: !!username && enabled,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  return { data, isPending, error }
}