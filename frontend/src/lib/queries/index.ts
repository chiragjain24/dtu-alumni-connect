import { api } from '../utils'
import { useQuery } from '@tanstack/react-query'

const useGetMyProfile = (enabled: boolean = true) => {
    const { data, isPending } = useQuery({
        queryKey: ['my-profile'],
        queryFn: async () => {
          const res = await api.users.profile.$get()
          if (!res.ok) {
            throw new Error('Failed to fetch profile')
          }
          return res.json()
        },
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        enabled: enabled,
      })
    
  return { data, isPending };
}

export default useGetMyProfile;