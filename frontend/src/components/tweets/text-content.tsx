import React from 'react'

// Regular expression to match URLs (with and without protocols)
// Matches: http://..., https://..., www.example.com, example.com
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\/[^\s]*)?|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g

function ensureProtocol(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return `https://${url}`
}

export function linkifyText(text: string): React.ReactNode[] {
  if (!text) return []
  
  const parts = text.split(URL_REGEX)
  
  return parts.map((part, index) => {
    if (URL_REGEX.test(part)) {
      const href = ensureProtocol(part)
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()} // Prevent tweet click when clicking link
        >
          {part}
        </a>
      )
    }
    return part
  })
}

interface TextContentProps {
  text: string
  className?: string
}

export function TextContent({ text, className }: TextContentProps) {
  const parts = linkifyText(text)
  
  return (
    <span className={className}>
      {parts}
    </span>
  )
} 