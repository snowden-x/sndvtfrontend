import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { ChatInput } from '@/components/chat/ChatInput'
import { ChatMessages } from '@/components/chat/ChatMessages'
import { type Message } from '@/components/chat/ChatMessage'
import { AutomationStatus } from '@/components/chat/AutomationStatus'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/_authenticated/chat/')({
  component: ChatComponent,
})

const WEBSOCKET_URL = 'ws://localhost:8000/api/ws'

function useChatSocket() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isSending, setIsSending] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [automationStatus, setAutomationStatus] = useState<'idle' | 'analyzing' | 'executing' | 'completed' | 'failed'>('idle')
  const [currentAutomationStep, setCurrentAutomationStep] = useState<string>('')
  const [currentTool, setCurrentTool] = useState<string>('')
  const ws = useRef<WebSocket | null>(null)
  const currentAiMessageId = useRef<string | null>(null)
  const processedMessageIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    ws.current = new WebSocket(WEBSOCKET_URL)

    ws.current.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)
      toast.success('Connected to AI Assistant')
    }

    ws.current.onclose = () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
      toast.error('Disconnected from AI Assistant')
      currentAiMessageId.current = null
      processedMessageIds.current.clear()
    }

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error)
      toast.error('An error occurred with the AI Assistant connection.')
      currentAiMessageId.current = null
      processedMessageIds.current.clear()
    }

    ws.current.onmessage = (event) => {
      try {
        const received = JSON.parse(event.data)
        console.log('WebSocket message received:', {
          type: received.type,
          hasContent: !!received.content,
          contentLength: received.content?.length || 0,
          contentPreview: received.content?.substring(0, 50) + '...',
          fullMessage: received
        })
        
        if (received.error || received.type === 'error') {
          toast.error(received.error || 'An error occurred')
          setIsSending(false)
          currentAiMessageId.current = null
          return
        }

        // Handle different message types from the backend
        if (received.type === 'start') {
          // Start of a new AI response
          const aiMessageId = `ai-${Date.now()}`
          currentAiMessageId.current = aiMessageId
          processedMessageIds.current.clear()
          
          // Check if this is an automation request
          const isAutomation = received.content?.includes('tool') || received.content?.includes('investigate')
          if (isAutomation) {
            setAutomationStatus('analyzing')
            setCurrentAutomationStep('Analyzing your request...')
          }
          
          const aiMessage: Message = {
            id: aiMessageId,
            text: received.content || '',
            sender: 'ai',
            isAutomation: isAutomation
          }
          
          setMessages((prev) => [...prev, aiMessage])
          return
        }
        
        if (received.type === 'tool_result') {
          // Automation tool execution result
          setAutomationStatus('executing')
          setCurrentTool(received.tool)
          setCurrentAutomationStep(`Executing ${received.tool}...`)
          
          const toolMessage: Message = {
            id: `tool-${Date.now()}`,
            text: `🔧 **${received.tool}** executed\n\n${received.output}`,
            sender: 'ai',
            isAutomation: true,
            toolResult: {
              tool: received.tool,
              success: received.success,
              output: received.output,
              data: received.data
            }
          }
          
          setMessages((prev) => [...prev, toolMessage])
          return
        }
        
        if (received.type === 'final_response') {
          // Final AI interpretation of automation results
          setAutomationStatus('completed')
          setCurrentAutomationStep('Analysis complete')
          
          const finalMessage: Message = {
            id: `final-${Date.now()}`,
            text: received.content,
            sender: 'ai',
            isAutomation: true
          }
          
          setMessages((prev) => [...prev, finalMessage])
          setIsSending(false)
          currentAiMessageId.current = null
          return
        }
        
        if (received.type === 'chunk' && received.content) {
          // Content chunk - append to current AI message
          if (!currentAiMessageId.current) {
            // First chunk - create new AI message
            const aiMessageId = `ai-${Date.now()}`
            currentAiMessageId.current = aiMessageId
            
            const aiMessage: Message = {
              id: aiMessageId,
              text: received.content,
              sender: 'ai',
            }
            
            setMessages((prev) => [...prev, aiMessage])
          } else {
            // Subsequent chunks - append to existing message
            setMessages((prev) => {
              return prev.map(msg => 
                msg.id === currentAiMessageId.current 
                  ? { ...msg, text: msg.text + received.content }
                  : msg
              )
            })
          }
          return
        }
        
        if (received.type === 'end' || received.type === 'complete') {
          // End of AI response
          setIsSending(false)
          currentAiMessageId.current = null
          processedMessageIds.current.clear()
          return
        }

        // Fallback for simple content format (only if no type is specified)
        if (!received.type && received.content) {
          // Create a simple hash to prevent duplicate processing
          const messageHash = `${received.content.substring(0, 20)}-${received.content.length}`
          
          if (processedMessageIds.current.has(messageHash)) {
            console.log('Duplicate message detected, skipping:', messageHash)
            return
          }
          
          processedMessageIds.current.add(messageHash)
          
          if (!currentAiMessageId.current) {
            // Create new message if none exists
            const aiMessageId = `ai-${Date.now()}`
            currentAiMessageId.current = aiMessageId
            
            const aiMessage: Message = {
              id: aiMessageId,
              text: received.content,
              sender: 'ai',
            }
            
            setMessages((prev) => [...prev, aiMessage])
            setIsSending(false)
            
            // Clear after processing
            setTimeout(() => {
              currentAiMessageId.current = null
              processedMessageIds.current.clear()
            }, 1000)
          } else {
            // Append to existing message
            setMessages((prev) => {
              return prev.map(msg => 
                msg.id === currentAiMessageId.current 
                  ? { ...msg, text: msg.text + received.content }
                  : msg
              )
            })
          }
        }
      } catch (error) {
        console.error('Error parsing message:', error)
        toast.error('Failed to parse message from AI Assistant.')
        setIsSending(false)
        currentAiMessageId.current = null
        processedMessageIds.current.clear()
      }
    }

    return () => {
      ws.current?.close()
      currentAiMessageId.current = null
      processedMessageIds.current.clear()
    }
  }, [])

  const sendMessage = (messageText: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        text: messageText,
        sender: 'user',
      }
      setMessages((prev) => [...prev, userMessage])
      setIsSending(true)
      setAutomationStatus('idle')
      setCurrentAutomationStep('')
      setCurrentTool('')
      currentAiMessageId.current = null

      // Prepare conversation history (exclude the current message we just added)
      const conversationHistory = messages.map(msg => ({
        id: msg.id,
        text: msg.text,
        sender: msg.sender
      }))

      // Send message with conversation history
      ws.current.send(JSON.stringify({ 
        query: messageText,
        conversation_history: conversationHistory
      }))
    } else {
      toast.error('Not connected to the AI Assistant.')
    }
  }

  return { 
    messages, 
    isSending, 
    sendMessage, 
    isConnected,
    automationStatus,
    currentAutomationStep,
    currentTool
  }
}

function ChatComponent() {
  const { 
    messages, 
    isSending, 
    sendMessage, 
    isConnected,
    automationStatus,
    currentAutomationStep,
    currentTool
  } = useChatSocket()

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      <Card className="flex flex-col h-full">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Nexus</CardTitle>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {messages.length} messages in context
                </span>
              )}
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0 p-0">
          {automationStatus !== 'idle' && (
            <div className="p-4 border-b bg-orange-50">
              <AutomationStatus
                status={automationStatus}
                currentStep={currentAutomationStep}
                toolName={currentTool}
              />
            </div>
          )}
          <div className="flex-1 overflow-auto">
            <ChatMessages messages={messages} />
          </div>
          <ChatInput onSendMessage={sendMessage} isSending={!isConnected || isSending} />
        </CardContent>
      </Card>
    </div>
  )
} 