import { createFileRoute } from '@tanstack/react-router'
import PersistentNetworkRAGChat from '@/components/chat/PersistentNetworkRAGChat'

export const Route = createFileRoute('/_authenticated/network/rag-chat')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      query: typeof search.query === 'string' ? search.query : undefined,
    }
  },
  component: RAGChatPage,
})

function RAGChatPage() {
  const { query } = Route.useSearch()
  return (
    <div className="h-[calc(100vh-12rem)]">
      <PersistentNetworkRAGChat className="h-full" initialQuery={query} />
    </div>
  )
}
