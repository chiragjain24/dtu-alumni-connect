import LeftSidebar from "./left-sidebar"
import MainContainer from "./main-container"
import RightSidebar from "./right-sidebar"

type Props = {
  children: React.ReactNode
}

const RootLayout = ({children}: Props) => {
  return (
    <div className='min-h-screen bg-background'>
      <div className='flex lg:gap-4 mx-auto max-w-7xl'>
        <LeftSidebar />
        <MainContainer>
          {children}
        </MainContainer>
        <RightSidebar />
      </div>
    </div>
  )
}

export default RootLayout