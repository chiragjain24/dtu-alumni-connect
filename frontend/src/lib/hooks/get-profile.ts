import { api } from '../utils'
import { useQuery } from '@tanstack/react-query'

const useGetProfile = () => {
    const { data, isPending } = useQuery({
        queryKey: ['user-profile'],
        queryFn: async () => {
          const res = await api.users.profile.$get()
          if (!res.ok) {
            throw new Error('Failed to fetch profile')
          }
          return res.json()
        },
        refetchOnWindowFocus: false,
      })
    
  return { data, isPending };
}

export default useGetProfile;