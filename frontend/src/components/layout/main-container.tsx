type Props = {
    children: React.ReactNode
}

const MainContainer = ({children}: Props) => {
  return (
    <div className='border-4 border-blue-800 w-full sm:w-[600px]'>
        {children}
    </div>
  )
}

export default MainContainer