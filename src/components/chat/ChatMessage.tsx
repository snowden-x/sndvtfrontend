import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  isAutomation?: boolean;
  toolResult?: {
    tool: string;
    success: boolean;
    output: string;
    data?: any;
  };
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
          <AvatarFallback className={cn(
            "text-white text-xs",
            message.isAutomation ? "bg-orange-500" : "bg-blue-500"
          )}>
            {message.isAutomation ? "🤖" : "N"}
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'p-3 rounded-lg max-w-[70%] whitespace-pre-wrap',
          isUser 
            ? 'bg-primary text-primary-foreground ml-auto' 
            : message.isAutomation
            ? 'bg-orange-50 border border-orange-200 text-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        {isUser ? (
          <p className="break-words">{message.text}</p>
        ) : (
          <div className="space-y-2">
            {message.isAutomation && message.toolResult && (
              <div className="flex items-center gap-2 text-sm text-orange-600 mb-2">
                <span className="font-semibold">🔧 {message.toolResult.tool}</span>
                <span className={cn(
                  "px-2 py-1 rounded text-xs",
                  message.toolResult.success 
                    ? "bg-green-100 text-green-700" 
                    : "bg-red-100 text-red-700"
                )}>
                  {message.toolResult.success ? "SUCCESS" : "FAILED"}
                </span>
              </div>
            )}
            <div 
              className="prose prose-sm max-w-none break-words"
              dangerouslySetInnerHTML={{ __html: formattedText }}
            />
          </div>
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