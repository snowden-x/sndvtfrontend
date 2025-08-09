import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Bot,
  Copy,
  ChevronDown,
  ChevronUp,
  User
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'rag';
  content: string;
  timestamp: number;
  sources?: string[];
  isExpanded?: boolean;
}

interface NetworkRAGChatProps {
  className?: string;
  initialQuery?: string;
}

export const NetworkRAGChat: React.FC<NetworkRAGChatProps> = ({
  className,
  initialQuery
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initialize with welcome message
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      type: 'system',
      content: '🤖 **Network Documentation Assistant**\n\nI can help you by answering questions about your network documentation and knowledge base.\n\nWhat would you like to know about your network?',
      timestamp: Date.now()
    }]);
  }, []);

  // Auto-send initial query if provided
  useEffect(() => {
    if (initialQuery && !isLoading) {
      sendRAGQuery(initialQuery);
    }
  }, [initialQuery]);

  // Send RAG query to backend
  const sendRAGQuery = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'user',
      content: query,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    try {
      console.log('Sending RAG query:', query);

      // Prepare conversation history for the API
      const conversationHistory = messages
        .filter(msg => msg.type === 'user' || msg.type === 'assistant')
        .map(msg => ({
          id: msg.id,
          sender: msg.type === 'user' ? 'user' : 'ai',
          text: msg.content,
          timestamp: new Date(msg.timestamp).toISOString()
        }));

      console.log('Sending conversation history:', conversationHistory);

      // Call the backend RAG API
      const requestBody = {
        query: query,
        conversation_history: conversationHistory
      };

      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let accumulatedResponse = '';
      let sources: string[] = [];

      // Create assistant message
      const assistantMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'assistant',
        content: '',
        timestamp: Date.now(),
        sources: []
      };

      setMessages(prev => [...prev, assistantMessage]);

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6); // Remove 'data: ' prefix

              try {
                const parsed = JSON.parse(data);

                if (parsed.type === 'chunk') {
                  accumulatedResponse += parsed.content;
                  // Update the message content in real-time
                  setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: accumulatedResponse }
                      : msg
                  ));
                } else if (parsed.type === 'complete') {
                  // Final message with sources
                  sources = parsed.sources || [];
                  setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: parsed.content, sources: sources }
                      : msg
                  ));
                } else if (parsed.type === 'error') {
                  throw new Error(parsed.error);
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      console.error('RAG query error:', error);
      const errorMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'assistant',
        content: 'Sorry, I encountered an error searching the documentation. Please try again.',
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error("Failed to search documentation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !inputValue.trim()) return;

    await sendRAGQuery(inputValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const toggleMessageExpansion = (messageId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const clearMessages = () => {
    setMessages([{
      id: 'welcome',
      type: 'system',
      content: '🤖 **Network Documentation Assistant**\n\nI can help you by answering questions about your network documentation and knowledge base.\n\nWhat would you like to know about your network?',
      timestamp: Date.now()
    }]);
    setExpandedMessages(new Set());
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const renderMessage = (message: Message) => {
    const isExpanded = expandedMessages.has(message.id);
    const hasSources = message.sources && message.sources.length > 0;

    return (
      <div key={message.id} className={`flex gap-3 p-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
        {message.type !== 'user' && (
          <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
        )}

        <div className={`max-w-[80%] ${message.type === 'user' ? 'order-first' : ''}`}>
          <Card className={`${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="text-sm opacity-70">
                  {message.type === 'user' ? 'You' : 'Assistant'} • {formatTime(message.timestamp)}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(message.content)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  {hasSources && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMessageExpansion(message.id)}
                      className="h-6 w-6 p-0"
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </Button>
                  )}
                </div>
              </div>

              <div className="whitespace-pre-wrap text-sm">{message.content}</div>

              {hasSources && isExpanded && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs font-medium mb-2">Sources:</div>
                  <div className="space-y-1">
                    {message.sources?.map((source, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {source}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {message.type === 'user' && (
          <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col ${className || ''}`}>
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Network Documentation Chat</CardTitle>
          <Button variant="outline" size="sm" onClick={clearMessages}>
            Clear Chat
          </Button>
        </div>
      </CardHeader>

      {/* Messages */}
      <ScrollArea className="h-full bottom-4">
        <Card className="flex-1">
            <div className="p-4 space-y-4">
              {messages.map(renderMessage)}
              {isLoading && (
                <div className="flex gap-3 p-4 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <Card className="bg-muted">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="text-sm">Working on it...</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
        </Card>

        {/* Input */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your network documentation..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !inputValue.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

      </ScrollArea>

    </div>
  );
};

export default NetworkRAGChat;
