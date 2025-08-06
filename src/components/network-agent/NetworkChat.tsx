import React, { useState, useEffect, useRef } from 'react'
import { 
  IconSend, 
  IconRobot, 
  IconUser, 
  IconLoader,
  IconTerminal,
  IconDeviceDesktop,
  IconCopy,
  IconCheck
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { DeviceSelector } from './DeviceSelector'
import { CommandSuggestions } from './CommandSuggestions'
import { networkAgentService, type Device } from '@/services/network-agent'

interface Message {
  id: string
  type: 'user' | 'agent' | 'system'
  content: string
  timestamp: string
  device?: string
  executionTime?: number
  isCommand?: boolean
}

// Device interface now imported from service

interface NetworkChatProps {
  sessionId?: string
  onSessionCreate?: (sessionId: string) => void
  className?: string
  compact?: boolean
}

export function NetworkChat({ 
  sessionId, 
  onSessionCreate, 
  className,
  compact = false 
}: NetworkChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [currentSessionId, setCurrentSessionId] = useState(sessionId)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // Using Sonner toast

  // Real API integration

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Load devices on component mount
    loadDevices()
    
    // Add welcome message
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        type: 'system',
        content: 'Welcome to Network Troubleshooting! I can help you diagnose network issues, execute commands, and discover devices. What would you like to do?',
        timestamp: new Date().toISOString()
      }])
    }
  }, [])

  const loadDevices = async () => {
    try {
      const response = await networkAgentService.getDevices()
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      if (response.data) {
        setDevices(response.data)
      }
    } catch (error) {
      toast.error("Failed to load devices")
    }
  }

  const createSession = async () => {
    try {
      const response = await networkAgentService.createSession({
        session_type: 'network',
        session_name: 'Network Troubleshooting'
      })
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      if (response.data) {
        setCurrentSessionId(response.data.id)
        if (onSessionCreate) {
          onSessionCreate(response.data.id)
        }
        return response.data.id
      }
      
      return null
    } catch (error) {
      toast.error("Failed to create session")
      return null
    }
  }

  const sendMessage = async (message: string, isCommand: boolean = false) => {
    if (!message.trim()) return

    // Ensure we have a session
    let sessionId = currentSessionId
    if (!sessionId) {
      const newSessionId = await createSession()
      if (!newSessionId) return
      sessionId = newSessionId
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      device: selectedDevice?.device_name,
      isCommand
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Real API calls
      let response
      if (isCommand) {
        const apiResponse = await networkAgentService.executeCommand({
          command: message,
          device_name: selectedDevice?.device_name,
          session_id: sessionId
        })
        
        if (apiResponse.error) {
          throw new Error(apiResponse.error)
        }
        
        response = apiResponse.data
      } else {
        const apiResponse = await networkAgentService.queryAgent({
          question: message,
          device_name: selectedDevice?.device_name,
          session_id: sessionId
        })
        
        if (apiResponse.error) {
          throw new Error(apiResponse.error)
        }
        
        response = apiResponse.data
      }

      if (response) {
        const agentMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'agent',
          content: isCommand ? (response as any).output : (response as any).answer,
          timestamp: new Date().toISOString(),
          device: response.device_used,
          executionTime: (response as any).execution_time_ms || (response as any).response_time_ms
        }

        setMessages(prev => [...prev, agentMessage])
      }

    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString()
      }
      
      setMessages(prev => [...prev, errorMessage])
      
      toast.error("Failed to get response from agent")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  const handleCommandSuggestion = (command: string) => {
    sendMessage(command, true)
  }

  const copyToClipboard = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
      
      toast.success("Message copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy to clipboard")
    }
  }

  const formatContent = (content: string) => {
    // Simple formatting for command outputs
    return content.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </span>
    ))
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {!compact && (
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <IconTerminal className="h-5 w-5" />
            <h2 className="font-semibold">Network Troubleshooting</h2>
          </div>
          
          <DeviceSelector
            devices={devices}
            selectedDevice={selectedDevice}
            onDeviceSelect={setSelectedDevice}
            onRefresh={loadDevices}
          />
        </div>
      )}

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.type === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.type !== 'user' && (
                <div className="flex-shrink-0">
                  {message.type === 'agent' ? (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <IconRobot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <IconTerminal className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              )}

              <Card className={cn(
                "max-w-[80%]",
                message.type === 'user' ? 'bg-primary text-primary-foreground' : '',
                message.type === 'system' ? 'bg-muted' : ''
              )}>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {message.device && (
                      <div className="flex items-center gap-2">
                        <IconDeviceDesktop className="h-3 w-3" />
                        <Badge variant="outline" className="text-xs">
                          {message.device}
                        </Badge>
                      </div>
                    )}
                    
                    <div className={cn(
                      "text-sm leading-relaxed",
                      message.isCommand && "font-mono bg-muted/50 p-2 rounded"
                    )}>
                      {formatContent(message.content)}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs opacity-70">
                      <span>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        {message.executionTime && (
                          <span>{message.executionTime}ms</span>
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(message.content, message.id)}
                          className="h-6 w-6 p-0"
                        >
                          {copiedMessageId === message.id ? (
                            <IconCheck className="h-3 w-3" />
                          ) : (
                            <IconCopy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {message.type === 'user' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <IconUser className="h-4 w-4 text-secondary-foreground" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <IconLoader className="h-4 w-4 text-primary-foreground animate-spin" />
              </div>
              <Card className="max-w-[80%]">
                <CardContent className="p-3">
                  <div className="text-sm text-muted-foreground">
                    Agent is thinking...
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t space-y-4">
        {!compact && (
          <CommandSuggestions
            selectedDevice={selectedDevice}
            onCommandSelect={handleCommandSuggestion}
          />
        )}
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              selectedDevice 
                ? `Ask about ${selectedDevice.device_name} or enter a command...`
                : "Ask a networking question or enter a command..."
            }
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!inputValue.trim() || isLoading}
            size="icon"
          >
            <IconSend className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}