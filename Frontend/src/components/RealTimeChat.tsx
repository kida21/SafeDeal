import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageCircle, Wifi, WifiOff } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { formatRelativeTime } from "../lib/utils";
import { Message } from "../types";
import { wsApi } from "../lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface RealTimeChatProps {
  isOpen: boolean;
  onClose: () => void;
  escrowId: number;
}

const RealTimeChat = ({ isOpen, onClose, escrowId }: RealTimeChatProps) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (isOpen && Number.isFinite(escrowId) && escrowId > 0) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [isOpen, escrowId]);

  const connectWebSocket = () => {
    if (!Number.isFinite(escrowId) || escrowId <= 0) {
      setConnectionError("Invalid escrow ID.");
      setIsConnected(false);
      return;
    }
    try {
      const ws = wsApi.connectChat(escrowId);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle history messages (array format)
          if (Array.isArray(data)) {
            const historyMessages = data.map(msg => ({
              id: msg.id || Date.now() + Math.random(),
              escrow_id: escrowId,
              sender_id: msg.sender_id,
              content: msg.content || '',
              created_at: msg.created_at || new Date().toISOString(),
              sender: msg.sender,
            }));
            setMessages(historyMessages);
          } else {
            // Handle single message (direct format from your test)
            const message: Message = {
              id: data.id || Date.now(),
              escrow_id: escrowId,
              sender_id: data.sender_id,
              content: data.content || '',
              created_at: data.created_at || new Date().toISOString(),
              sender: data.sender,
            };

            setMessages((prev) => {
              // Check if message already exists to prevent duplicates
              const exists = prev.some(msg => msg.id === message.id);
              if (exists) return prev;
              return [...prev, message];
            });
          }
        } catch (error) {
          // Handle non-JSON messages silently
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setConnectionError("Connection lost. Chat service unavailable.");
      };

      ws.onerror = () => {
        setConnectionError(
          "Chat service unavailable. Backend may not be running."
        );
        setIsConnected(false);
      };
    } catch (error) {
      setConnectionError(
        "Chat service unavailable. Backend may not be running."
      );
      setIsConnected(false);
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionError(null);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isConnected || !wsRef.current) return;

    const messageData = {
      content: newMessage.trim(),
    };

    try {
      wsRef.current.send(JSON.stringify(messageData));
      setNewMessage("");
    } catch (error) {
      setConnectionError("Failed to send message");
    }
  };

  const getConnectionStatus = () => {
    if (isConnected) {
      return (
        <div className="flex items-center text-green-600">
          <Wifi className="h-4 w-4 mr-1" />
          <span className="text-xs">Connected</span>
        </div>
      );
    } else if (connectionError) {
      return (
        <div className="flex items-center text-red-600">
          <WifiOff className="h-4 w-4 mr-1" />
          <span className="text-xs">Disconnected</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-yellow-600">
          <WifiOff className="h-4 w-4 mr-1" />
          <span className="text-xs">Connecting...</span>
        </div>
      );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl w-full max-w-2xl h-[600px] shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-100 rounded-full">
                  <MessageCircle className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Escrow Chat
                  </h3>
                  <p className="text-sm text-gray-600">Escrow #{escrowId}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {getConnectionStatus()}
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Connection Error */}
            {connectionError && (
              <div className="px-6 py-3 bg-red-50 border-b border-red-200">
                <div className="flex items-center text-red-700">
                  <WifiOff className="h-4 w-4 mr-2" />
                  <span className="text-sm">{connectionError}</span>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageCircle className="h-10 w-10 text-primary-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">
                    Start the conversation
                  </h4>
                  <p className="text-gray-600 max-w-sm mx-auto leading-relaxed">
                    Send your first message to begin chatting about this escrow transaction.
                  </p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.sender_id === user?.id;
                  const hasContent = message.content && message.content.trim();
                  
                  if (!hasContent) return null;
                  
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex mb-4 ${
                        isOwn ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${
                        isOwn ? "flex-row-reverse space-x-reverse" : "flex-row"
                      }`}>
                        {/* Avatar */}
                        {!isOwn && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {message.sender?.first_name?.[0] || 'U'}
                          </div>
                        )}
                        
                        {/* Message bubble */}
                        <div className="flex flex-col">
                          {!isOwn && (
                            <p className="text-xs font-medium text-gray-600 mb-1 px-1">
                              {message.sender?.first_name} {message.sender?.last_name}
                            </p>
                          )}
                          <div
                            className={`px-4 py-3 rounded-2xl shadow-sm ${
                              isOwn
                                ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-br-md"
                                : "bg-white border border-gray-200 text-gray-900 rounded-bl-md"
                            }`}
                          >
                            <div className={`text-sm leading-relaxed break-words ${
                              isOwn ? "markdown-white" : "markdown-dark"
                            }`}>
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                                  strong: ({ children }) => <strong className={isOwn ? "font-bold text-white" : "font-bold text-gray-900"}>{children}</strong>,
                                  em: ({ children }) => <em className={isOwn ? "italic text-white" : "italic text-gray-800"}>{children}</em>,
                                  code: ({ children }) => (
                                    <code className={`px-1 py-0.5 rounded text-xs font-mono ${
                                      isOwn 
                                        ? "bg-primary-700 text-primary-100" 
                                        : "bg-gray-200 text-gray-800"
                                    }`}>
                                      {children}
                                    </code>
                                  ),
                                  pre: ({ children }) => (
                                    <pre className={`p-2 rounded text-xs font-mono overflow-x-auto ${
                                      isOwn 
                                        ? "bg-primary-700 text-primary-100" 
                                        : "bg-gray-200 text-gray-800"
                                    }`}>
                                      {children}
                                    </pre>
                                  ),
                                  ul: ({ children }) => <ul className="list-disc list-inside space-y-1">{children}</ul>,
                                  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1">{children}</ol>,
                                  li: ({ children }) => <li className="text-sm">{children}</li>,
                                  h1: ({ children }) => <h1 className={`text-lg font-bold mb-1 ${isOwn ? "text-white" : "text-gray-900"}`}>{children}</h1>,
                                  h2: ({ children }) => <h2 className={`text-base font-bold mb-1 ${isOwn ? "text-white" : "text-gray-900"}`}>{children}</h2>,
                                  h3: ({ children }) => <h3 className={`text-sm font-bold mb-1 ${isOwn ? "text-white" : "text-gray-900"}`}>{children}</h3>,
                                  blockquote: ({ children }) => (
                                    <blockquote className={`border-l-2 pl-2 italic ${
                                      isOwn 
                                        ? "border-primary-300 text-primary-100" 
                                        : "border-gray-400 text-gray-700"
                                    }`}>
                                      {children}
                                    </blockquote>
                                  ),
                                  a: ({ children, href }) => (
                                    <a 
                                      href={href} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className={`underline hover:no-underline ${
                                        isOwn 
                                          ? "text-primary-100 hover:text-white" 
                                          : "text-primary-600 hover:text-primary-800"
                                      }`}
                                    >
                                      {children}
                                    </a>
                                  ),
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                          <p
                            className={`text-xs mt-1 px-1 ${
                              isOwn ? "text-right text-gray-500" : "text-left text-gray-500"
                            }`}
                          >
                            {formatRelativeTime(message.created_at)}
                          </p>
                        </div>
                        
                        {/* Own avatar */}
                        {isOwn && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {user?.first_name?.[0] || 'M'}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                }).filter(Boolean)
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-6 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder={
                      isConnected ? "Type your message with **markdown**... (Press Enter to send, Shift+Enter for new line)" : "Connecting..."
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all duration-200 max-h-32 min-h-[48px]"
                    disabled={!isConnected}
                    rows={1}
                    style={{
                      height: 'auto',
                      minHeight: '48px',
                      maxHeight: '128px'
                    }}
                    ref={(textarea) => {
                      if (textarea) {
                        textarea.style.height = 'auto';
                        textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px';
                      }
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!isConnected || !newMessage.trim()}
                  className={`p-3 rounded-full transition-all duration-200 ${
                    !isConnected || !newMessage.trim()
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-br from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl transform hover:scale-105"
                  }`}
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RealTimeChat;
