import { backend } from './lib/utils'
import { useQuery } from '@tanstack/react-query'

function App() {
  
  const {data, isPending, isFetching, error} = useQuery({
    queryKey: ['get-expenses'],
    queryFn: async () => {
      const res = await backend.expenses.$get();
      if(!res.ok) {
        throw new Error('Failed to fetch expenses')
      }
      return res.json()
    },
    refetchOnWindowFocus: false,
  })

  if(isPending) return <div>Loading...</div>
  if(isFetching) return <div>Fetching...</div>
  if(error) return <div>Error: {error.message}</div>

  return (
    <>
      <h1>Hello World</h1>
      <p>{JSON.stringify(data)}</p>
    </>
  )
}

export default App
