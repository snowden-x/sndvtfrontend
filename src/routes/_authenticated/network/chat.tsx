import { createFileRoute } from '@tanstack/react-router'
import { NetworkChat } from '@/components/network-agent/NetworkChat'

export const Route = createFileRoute('/_authenticated/network/chat')({
  component: NetworkChatPage,
})

function NetworkChatPage() {
  return (
    <div className="h-[calc(100vh-12rem)]">
      <NetworkChat />
    </div>
  )
}