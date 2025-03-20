import React, { memo } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

type ChatMessageProps = {
  content: string;
  role: 'user' | 'assistant';
  isLoading?: boolean;
};

// Memoize the component to prevent unnecessary re-renders
const ChatMessageComponent = ({ content, role, isLoading = false }: ChatMessageProps) => {
  return (
    <div
      className={cn(
        'flex w-full items-start gap-4 p-4 rounded-lg',
        role === 'user' ? 'bg-blue-50' : 'bg-slate-50'
      )}
    >
      <Avatar className={cn('h-8 w-8', role === 'assistant' ? 'bg-blue-600' : 'bg-slate-600')}>
        {role === 'assistant' ? (
          <Bot className="h-5 w-5 text-white" />
        ) : (
          <User className="h-5 w-5 text-white" />
        )}
      </Avatar>
      <div className="flex-1 space-y-2">
        <div className="font-semibold">
          {role === 'assistant' ? 'Bruce (Assistant)' : 'You'}
        </div>
        <div className="prose prose-slate">
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600" style={{ animationDelay: '0.2s' }}></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600" style={{ animationDelay: '0.4s' }}></div>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{content}</div>
          )}
        </div>
      </div>
    </div>
  );
};

// Export a memoized version of the component to prevent re-renders when props haven't changed
export const ChatMessage = memo(ChatMessageComponent, (prevProps, nextProps) => {
  // Only re-render if any of these props change
  return (
    prevProps.content === nextProps.content &&
    prevProps.role === nextProps.role &&
    prevProps.isLoading === nextProps.isLoading
  );
});