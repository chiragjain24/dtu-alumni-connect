type Props = {
    children: React.ReactNode
}

const MainContainer = ({children}: Props) => {
  return (
    <div className='w-full sm:w-[600px] border-x border-border min-h-screen'>
        {children}
    </div>
  )
}

export default MainContainer