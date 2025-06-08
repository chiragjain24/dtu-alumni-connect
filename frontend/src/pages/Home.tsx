import { Timeline } from '../components/tweets/timeline'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <h1 className="text-xl font-bold text-foreground">Home</h1>
      </div>

      {/* Timeline with Tweet Composer */}
      <Timeline />
    </div>
  )
} 