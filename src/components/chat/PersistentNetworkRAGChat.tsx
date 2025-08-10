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
  User,
  MessageSquare,
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  Archive
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { conversationService, type Conversation, type Message } from '@/services/conversations';

interface PersistentMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  sources?: string[];
  isExpanded?: boolean;
}

interface PersistentNetworkRAGChatProps {
  className?: string;
  initialQuery?: string;
}

export const PersistentNetworkRAGChat: React.FC<PersistentNetworkRAGChatProps> = ({
  className,
  initialQuery
}) => {
  const [messages, setMessages] = useState<PersistentMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [showConversations, setShowConversations] = useState(false);
  const [editingTitle, setEditingTitle] = useState<number | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load conversation if there are existing conversations but no current one
  useEffect(() => {
    if (conversations.length > 0 && !currentConversation) {
      // Load the most recent conversation
      loadConversation(conversations[0].id);
    } else if (conversations.length === 0) {
      // Initialize with welcome message if no conversations
      setMessages([{
        id: 'welcome',
        type: 'system',
        content: '🤖 **Network Documentation Assistant**\n\nI can help you by answering questions about your network documentation and knowledge base.\n\nWhat would you like to know about your network?',
        timestamp: Date.now()
      }]);
    }
  }, [conversations, currentConversation]);

  // Auto-send initial query if provided
  useEffect(() => {
    if (initialQuery && !isLoading && !currentConversation) {
      sendMessage(initialQuery);
    }
  }, [initialQuery, isLoading, currentConversation]);

  const loadConversations = async () => {
    try {
      const convs = await conversationService.getConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast.error('Failed to load conversation history');
    }
  };

  const loadConversation = async (conversationId: number) => {
    try {
      const conversation = await conversationService.getConversation(conversationId);
      setCurrentConversation(conversation);
      
      // Convert backend messages to frontend format
      const frontendMessages: PersistentMessage[] = conversation.messages?.map(msg => ({
        id: msg.id.toString(),
        type: msg.message_type as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: new Date(msg.created_at).getTime(),
        sources: msg.sources
      })) || [];

      setMessages(frontendMessages);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      toast.error('Failed to load conversation');
    }
  };

  const createNewConversation = async (firstMessage?: string) => {
    try {
      const title = firstMessage ? firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '') : 'New Conversation';
      const conversation = await conversationService.createConversation({ title });
      setCurrentConversation(conversation);
      setMessages([]);
      await loadConversations(); // Refresh the conversations list
      return conversation;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast.error('Failed to create new conversation');
      return null;
    }
  };

  const sendMessage = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);

    // Add user message immediately to UI
    const userMessage: PersistentMessage = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'user',
      content: query,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    try {
      // Create conversation if none exists
      let conversationId = currentConversation?.id;
      if (!conversationId) {
        const newConversation = await createNewConversation(query);
        if (!newConversation) {
          throw new Error('Failed to create conversation');
        }
        conversationId = newConversation.id;
      }

      // Create assistant message placeholder
      const assistantMessage: PersistentMessage = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'assistant',
        content: '',
        timestamp: Date.now(),
        sources: []
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Stream the response
      const requestData = {
        query,
        conversation_id: conversationId
      };

      let accumulatedResponse = '';
      let sources: string[] = [];

      for await (const chunk of conversationService.streamChatResponse(requestData)) {
        if (chunk.type === 'chunk') {
          accumulatedResponse = chunk.accumulated || accumulatedResponse + chunk.content;
          // Update the message content in real-time
          setMessages(prev => prev.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, content: accumulatedResponse }
              : msg
          ));
        } else if (chunk.type === 'complete') {
          // Final message with sources
          sources = chunk.sources || [];
          setMessages(prev => prev.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, content: chunk.content, sources: sources }
              : msg
          ));

          // Update current conversation info if returned
          if (chunk.conversation_id && chunk.conversation_title) {
            setCurrentConversation(prev => prev ? {
              ...prev,
              id: chunk.conversation_id,
              title: chunk.conversation_title
            } : null);
          }

          // Refresh conversations list to show updated timestamp
          await loadConversations();
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error);
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: PersistentMessage = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !inputValue.trim()) return;
    await sendMessage(inputValue);
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

  const handleNewConversation = async () => {
    await createNewConversation();
    setShowConversations(false);
  };

  const handleConversationSelect = (conversation: Conversation) => {
    loadConversation(conversation.id);
    setShowConversations(false);
  };

  const handleRenameConversation = async (conversationId: number, newTitle: string) => {
    try {
      await conversationService.updateConversation(conversationId, { title: newTitle });
      await loadConversations();
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(prev => prev ? { ...prev, title: newTitle } : null);
      }
      toast.success('Conversation renamed');
    } catch (error) {
      console.error('Failed to rename conversation:', error);
      toast.error('Failed to rename conversation');
    }
  };

  const handleDeleteConversation = async (conversationId: number) => {
    try {
      await conversationService.deleteConversation(conversationId);
      await loadConversations();
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const startEditingTitle = (conversation: Conversation) => {
    setEditingTitle(conversation.id);
    setEditTitleValue(conversation.title);
  };

  const saveTitle = async (conversationId: number) => {
    if (editTitleValue.trim()) {
      await handleRenameConversation(conversationId, editTitleValue.trim());
    }
    setEditingTitle(null);
    setEditTitleValue('');
  };

  const cancelEditingTitle = () => {
    setEditingTitle(null);
    setEditTitleValue('');
  };

  const renderMessage = (message: PersistentMessage) => {
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
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">
              {currentConversation?.title || 'Network Documentation Chat'}
            </CardTitle>
            {currentConversation && (
              <Badge variant="outline" className="text-xs">
                ID: {currentConversation.id}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Dialog open={showConversations} onOpenChange={setShowConversations}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Conversations ({conversations.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Chat History</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleNewConversation}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Conversation
                  </Button>
                  
                  <ScrollArea className="h-64">
                    <div className="space-y-1">
                      {conversations.map((conversation) => (
                        <div key={conversation.id} className="group flex items-center gap-2">
                          {editingTitle === conversation.id ? (
                            <div className="flex-1 flex gap-1">
                              <Input
                                value={editTitleValue}
                                onChange={(e) => setEditTitleValue(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    saveTitle(conversation.id);
                                  } else if (e.key === 'Escape') {
                                    cancelEditingTitle();
                                  }
                                }}
                                className="h-8 text-sm"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                className="h-8"
                                onClick={() => saveTitle(conversation.id)}
                              >
                                Save
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Button
                                variant={currentConversation?.id === conversation.id ? "default" : "ghost"}
                                className="flex-1 justify-start text-left h-auto py-2"
                                onClick={() => handleConversationSelect(conversation)}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium truncate">
                                    {conversation.title}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(conversation.updated_at).toLocaleDateString()} • {conversation.message_count || 0} messages
                                  </div>
                                </div>
                              </Button>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => startEditingTitle(conversation)}>
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteConversation(conversation.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" size="sm" onClick={handleNewConversation}>
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>
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

export default PersistentNetworkRAGChat;

