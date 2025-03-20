import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Bot, AlertCircle } from 'lucide-react';
import { useAuthStore } from 'utils/auth';
import brain from 'brain';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
};

export function BruceChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamAbortController = useRef<AbortController | null>(null);
  const { isAuthenticated } = useAuthStore();

  // Load message history on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadMessageHistory();
    }
    
    // Cleanup function to abort any active streams when component unmounts
    return () => {
      if (streamAbortController.current) {
        console.log('Aborting active stream on unmount');
        streamAbortController.current.abort();
      }
    };
  }, [isAuthenticated]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load message history from API - using useCallback to optimize performance
  const loadMessageHistory = useCallback(async () => {
    // Early return optimization
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      console.log('Loading conversation history...');
      
      // Use a small delay to prevent UI blocking
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const response = await brain.get_conversation_history_endpoint();
      const data = await response.json();
      
      if (response.ok && data.history) {
        console.log(`Loaded ${data.history.length} messages from history`);
        
        // Process in chunks to avoid blocking UI
        setTimeout(() => {
          const cleanedMessages = data.history.map((msg: any) => ({
            role: msg.role,
            content: msg.content.replace(/<think>[\s\S]*?<\/think>/g, ''), // Clean any thinking tags
            timestamp: msg.timestamp
          }));
          
          setMessages(cleanedMessages);
          
          // Add welcome message if history is empty
          if (data.history.length === 0) {
            const welcomeMessage: Message = {
              role: 'assistant',
              content: "Hello! I'm Bruce, your CareConnect assistant. How can I help you today with scheduling, caregiver management, or client operations?",
              timestamp: new Date().toISOString()
            };
            setMessages([welcomeMessage]);
            // Save welcome message to history (but don't await to prevent blocking)
            addMessageToHistory(welcomeMessage).catch(error => {
              console.error('Failed to add welcome message to history:', error);
            });
          }
        }, 0);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      toast.error('Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Add a message to the history - non-blocking
  const addMessageToHistory = async (message: Message) => {
    try {
      await brain.add_to_conversation_history({
        role: message.role,
        content: message.content,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to add message to history:', error);
    }
  };

  // Handle sending a new message - optimized for performance
  const handleSendMessage = async (content: string) => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to use the chat');
      return;
    }

    // Cancel any previous stream that might be in progress
    if (streamAbortController.current) {
      streamAbortController.current.abort();
    }
    
    // Create new abort controller for this request
    streamAbortController.current = new AbortController();

    // Add user message to UI immediately
    const userMessage: Message = { role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);
    
    // Add user message to history without awaiting to prevent UI blocking
    addMessageToHistory(userMessage).catch(error => {
      console.error('Failed to add user message to history:', error);
    });
    
    // Start generating assistant response
    setIsLoading(true);
    
    // Initialize empty assistant message
    const assistantMessage: Message = { role: 'assistant', content: '' };
    setMessages((prev) => [...prev, assistantMessage]);
    
    // Small delay to let UI update before starting stream
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // To reduce memory usage during streaming, ensure old messages over a limit are cleaned up
    if (messages.length > 100) {
      // Keep only the most recent 100 messages to prevent excessive memory usage
      setMessages(prevMessages => prevMessages.slice(-100));
      // Add a notification about trimmed messages
      toast.info('Some older messages were archived to improve performance');
    }
    
    try {  
      // Use streaming response
      const messagesForApi = messages.concat(userMessage);
      console.log('Sending chat request to Bruce assistant...');
      
      // This will process the stream and update the UI in real-time
      let fullResponse = '';
      
      try {
        // Use streaming with batched UI updates to reduce render load
        const updateInterval = 50; // ms
        let lastUpdateTime = Date.now();
        let pendingContent = '';
        
        for await (const chunk of brain.chat_with_bruce_stream({
          messages: messagesForApi.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          stream: true
        })) {
          if (typeof chunk === 'string') {
            // Remove thinking tags if present
            const cleanedChunk = chunk.replace(/<think>[\s\S]*?<\/think>/g, '');
            
            if (cleanedChunk) {
              fullResponse += cleanedChunk;
              pendingContent += cleanedChunk;
              
              // Batch updates to reduce rendering frequency
              const now = Date.now();
              if (now - lastUpdateTime > updateInterval) {
                // Update the last message with the accumulated response
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1].content = fullResponse;
                  return updated;
                });
                lastUpdateTime = now;
                pendingContent = '';
              }
            }
          }
        }
        
        // Final update with any remaining content
        if (pendingContent) {
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1].content = fullResponse;
            return updated;
          });
        }
      } catch (error) {
        // Check if this was an abort, which is normal and should be handled gracefully
        if (error.name === 'AbortError') {
          console.log('Stream was aborted');
          // No need for error handling, this was intentional
          setIsLoading(false);
          return;
        }
        
        console.error('Streaming error:', error);
        // Continue with non-streaming fallback if streaming fails
      }
      
      // If we didn't get a response from streaming, try non-streaming as fallback
      if (!fullResponse) {
        console.log('Streaming failed, trying non-streaming fallback');
        try {
          const response = await brain.chat_with_bruce({
            messages: messagesForApi.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            stream: false
          });
          
          const data = await response.json();
          if (data.message && data.message.content) {
            // Clean the response of any thinking tags
            fullResponse = data.message.content.replace(/<think>[\s\S]*?<\/think>/g, '');
            // Update the last message with the final response
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1].content = fullResponse;
              return updated;
            });
          }
        } catch (secondError) {
          console.error('Non-streaming fallback error:', secondError);
          toast.error('Failed to get response from Bruce');
          // Remove the loading message
          setMessages(prev => prev.slice(0, -1));
          setIsLoading(false);
          return;
        }
      }
      
      // Add final assistant message to history without awaiting to prevent UI blocking
      if (fullResponse) {
        addMessageToHistory({ role: 'assistant', content: fullResponse }).catch(error => {
          console.error('Failed to add assistant response to history:', error);
        });
      }
      
    } catch (error) {
      console.error('Failed to get response from Bruce:', error);
      toast.error('Failed to get response from Bruce');
      
      // Remove the loading message
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      streamAbortController.current = null;
    }
  };

  // Show confirmation dialog for clearing chat history
  const showClearConfirmation = () => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to clear chat history');
      return;
    }
    
    setShowClearConfirm(true);
  };
  
  // Actually clear the chat history after confirmation
  const handleClearChat = async () => {
    try {
      setIsClearingHistory(true);
      setShowClearConfirm(false); // Close the dialog
      
      // Use a small delay to prevent UI blocking
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const response = await brain.clear_conversation_history();
      
      if (response.ok) {
        setMessages([]);
        // Add welcome message after clearing
        const welcomeMessage: Message = {
          role: 'assistant',
          content: "Hello! I'm Bruce, your CareConnect assistant. How can I help you today with scheduling, caregiver management, or client operations?",
          timestamp: new Date().toISOString()
        };
        setMessages([welcomeMessage]);
        // Save welcome message to history without awaiting to prevent UI blocking
        addMessageToHistory(welcomeMessage).catch(error => {
          console.error('Failed to add welcome message to history after clearing:', error);
        });
        toast.success('Chat history cleared');
      } else {
        toast.error('Failed to clear chat history');
      }
    } catch (error) {
      console.error('Failed to clear chat history:', error);
      toast.error('Failed to clear chat history');
    } finally {
      setIsClearingHistory(false);
    }
  };

  return (
    <>
      <Card className="flex flex-col h-[600px] max-h-[600px] w-full p-4 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Bruce (Assistant)</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={showClearConfirmation}
            disabled={messages.length === 0 || isLoading || isClearingHistory || !isAuthenticated}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isClearingHistory ? 'Clearing...' : 'Clear Chat'}
          </Button>
        </div>
        
        {!isAuthenticated && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication required</AlertTitle>
            <AlertDescription>
              You must be logged in to use the Bruce Assistant. Please log in to continue.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Messages container with scroll */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center space-y-2">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">No messages yet. Start chatting with Bruce!</p>
              </div>
            </div>
          ) : (
            /* Use proper keys to help React optimize rendering */
            messages.map((message, index) => (
              <ChatMessage
                key={`msg-${index}-${message.role}-${message.timestamp || ''}`}
                role={message.role}
                content={message.content}
                isLoading={isLoading && index === messages.length - 1 && message.role === 'assistant' && message.content === ''}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input area */}
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isLoading || !isAuthenticated}
          placeholder="Ask Bruce about the CareConnect system..."
        />
      </Card>
      
      {/* Confirmation dialog for clearing chat */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Conversation History</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear your entire conversation history with Bruce? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleClearChat} disabled={isClearingHistory}>
              {isClearingHistory ? 'Clearing...' : 'Clear History'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
