type Props = {
    children: React.ReactNode
}

const MainContainer = ({children}: Props) => {
  return (
    <div className='w-full sm:w-[600px] border-x border-border min-h-screen pb-20 sm:pb-0'>
        {children}
    </div>
  )
}

export default MainContainer