import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

interface ChatMessageProps {
  message: Message;
}

// Simple markdown-like formatting
const formatText = (text: string) => {
  if (!text) return '';
  
  // Convert **bold** to <strong>
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert *italic* to <em>
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Convert `code` to <code>
  formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>');
  
  // Convert newlines to <br>
  formatted = formatted.replace(/\n/g, '<br>');
  
  return formatted;
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const formattedText = formatText(message.text);
  
  return (
    <div className={cn('flex items-start gap-3 mb-4', isUser ? 'justify-end' : '')}>
      {!isUser && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="bg-blue-500 text-white text-xs">N</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'p-3 rounded-lg max-w-[70%] whitespace-pre-wrap',
          isUser 
            ? 'bg-primary text-primary-foreground ml-auto' 
            : 'bg-muted text-foreground'
        )}
      >
        {isUser ? (
          <p className="break-words">{message.text}</p>
        ) : (
          <div 
            className="prose prose-sm max-w-none break-words"
            dangerouslySetInnerHTML={{ __html: formattedText }}
          />
        )}
      </div>
      {isUser && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="bg-gray-500 text-white text-xs">U</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}; 