import LeftSidebar from "./left-sidebar"
import MainContainer from "./main-container"
import RightSidebar from "./right-sidebar"

type Props = {
  children: React.ReactNode
}

const RootLayout = ({children}: Props) => {
  return (
    <>
      <div className='border-4 border-red-800 flex gap-4 mx-auto max-w-7xl'>
        <LeftSidebar />
        <MainContainer>
          {children}
        </MainContainer>
        <RightSidebar />
      </div>
    </>
  )
}

export default RootLayout