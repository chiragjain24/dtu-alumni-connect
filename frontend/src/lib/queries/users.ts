import { api } from '../utils'
import { useQuery } from '@tanstack/react-query'

const useGetUserProfile = (username: string) => {
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
    enabled: !!username,
    refetchOnWindowFocus: false,
  })

  return { data, isPending, error }
}

export default useGetUserProfile 