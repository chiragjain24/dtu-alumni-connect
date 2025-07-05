import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../ui/button'

interface BackButtonProps {
  className?: string
  onClick?: () => void
}

export function BackButton({ className = '', onClick }: BackButtonProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      navigate(-1)
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={handleClick}
      className={`p-2 ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
    </Button>
  )
} 