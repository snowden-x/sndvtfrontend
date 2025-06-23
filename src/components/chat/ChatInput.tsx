import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Paperclip, Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isSending: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isSending }) => {
  const [message, setMessage] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isSending) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="p-4 border-t bg-background/50 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          type="button"
          className="mb-1 opacity-50 cursor-not-allowed"
          disabled
        >
          <Paperclip className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Press Enter to send)"
            disabled={isSending}
            className="min-h-[44px] resize-none"
          />
        </div>
        <Button 
          type="submit" 
          size="icon" 
          disabled={isSending || !message.trim()}
          className="mb-1"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
      {isSending && (
        <div className="text-xs text-muted-foreground mt-2 pl-12">
          AI is typing...
        </div>
      )}
    </div>
  );
}; 