import { ChatContainer } from './components/chat/ChatContainer'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Network Diagnostic Assistant</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <ChatContainer />
      </main>
    </div>
  )
}

export default App
