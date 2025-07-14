
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, User, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FormattedMessage } from "@/components/FormattedMessage";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isLoading?: boolean;
}

interface ChatAreaProps {
  isOpen: boolean;
  onClose: () => void;
}

const BACKEND_URL = 'http://localhost:5000';

const ChatArea = ({ isOpen, onClose }: ChatAreaProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `## Welcome to Your AI Financial Assistant! 🤖

I'm powered by Mistral AI and I'm here to help you with:

- **Budget Planning**: Create and manage your budgets
- **Expense Analysis**: Understand your spending patterns  
- **Financial Goals**: Set and track your financial objectives
- **Money Tips**: Get personalized financial advice
- **Investment Basics**: Learn about saving and investing

**What would you like to know about your finances today?**`,
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const callBackendAPI = async (message: string): Promise<string> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          context: 'User is using a personal finance management application'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.response || 'Sorry, I could not process your request.';
    } catch (error) {
      console.error('Error calling backend API:', error);
      return 'Sorry, I\'m having trouble connecting to the AI service. Please make sure the Python backend is running and Ollama is installed with the Mistral model.';
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage;
    const newUserMessage: Message = {
      id: `user-${Date.now()}-${Math.random()}`,
      text: userMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Add loading message
    const loadingMessage: Message = {
      id: `loading-${Date.now()}-${Math.random()}`,
      text: 'Thinking...',
      sender: 'ai',
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Call the backend API
      const aiResponseText = await callBackendAPI(userMessage);
      
      // Remove loading message and add actual response
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.isLoading);
        const aiResponse: Message = {
          id: `ai-${Date.now()}-${Math.random()}`,
          text: aiResponseText,
          sender: 'ai',
          timestamp: new Date(),
        };
        return [...withoutLoading, aiResponse];
      });
    } catch (error) {
      // Remove loading message and add error response
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.isLoading);
        const errorResponse: Message = {
          id: `error-${Date.now()}-${Math.random()}`,
          text: 'Sorry, I encountered an error while processing your request. Please try again.',
          sender: 'ai',
          timestamp: new Date(),
        };
        return [...withoutLoading, errorResponse];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`fixed ${
            isFullscreen 
              ? 'inset-4' 
              : 'right-4 top-4 bottom-4 w-96'
          } bg-card border border-border rounded-lg shadow-apple-xl z-50 flex flex-col`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">AI Financial Assistant</h3>
              <span className="text-xs text-muted-foreground">Powered by Mistral</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="h-8 w-8 hover:bg-accent"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.sender === 'ai' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {message.isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {message.text}
                      </div>
                    ) : message.sender === 'ai' ? (
                      <FormattedMessage text={message.text} />
                    ) : (
                      message.text
                    )}
                  </div>
                  {message.sender === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border space-y-3">
            {/* Quick suggestions */}
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setInputMessage("How can I create a budget?")}
                >
                  💰 Create Budget
                </Button>
                <Button
                  variant="outline"
                  size="sm" 
                  className="text-xs"
                  onClick={() => setInputMessage("Analyze my spending patterns")}
                >
                  📊 Analyze Spending
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setInputMessage("Tips for saving money")}
                >
                  💡 Save Money
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about your finances..."
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                disabled={!inputMessage.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatArea;
