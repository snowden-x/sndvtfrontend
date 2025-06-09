import { useState, useRef, useEffect } from 'react';
import { Socket, io } from 'socket.io-client';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { InputField } from '@/components/chat/InputField';
import { TypingIndicator } from '@/components/chat/TypingIndicator';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://172.20.10.2:8000', {
      transports: ['polling', 'websocket'],
      path: '/socket.io',
      autoConnect: true,
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    // Socket event handlers
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
      setIsConnected(true);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('message', (data: Message) => {
      setMessages(prev => [...prev, {
        ...data,
        id: Date.now().toString(),
        timestamp: new Date(data.timestamp || Date.now())
      }]);
      if (data.sender === 'assistant') {
        setIsTyping(false);
      }
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      // TODO: Add error handling UI
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (content: string) => {
    if (!content.trim() || !socket) return;

    const message = {
      content,
      timestamp: new Date().toISOString()
    };

    socket.emit('message', message);
    setIsTyping(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto p-4 bg-background">
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {!isConnected && (
          <div className="text-center text-muted-foreground py-4">
            Connecting to server...
          </div>
        )}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      <InputField onSendMessage={handleSendMessage} />
    </div>
  );
} 