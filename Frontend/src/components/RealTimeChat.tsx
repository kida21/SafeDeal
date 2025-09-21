import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle, Wifi, WifiOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { formatRelativeTime } from '../lib/utils';
import { Message } from '../types';
import { wsApi } from '../lib/api';

interface RealTimeChatProps {
  isOpen: boolean;
  onClose: () => void;
  escrowId: number;
}

const RealTimeChat = ({ isOpen, onClose, escrowId }: RealTimeChatProps) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (isOpen) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [isOpen, escrowId]);

  const connectWebSocket = () => {
    try {
      const ws = wsApi.connectChat(escrowId);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message:', data);
          
          if (data.type === 'message') {
            const message: Message = {
              id: data.id || Date.now(),
              escrow_id: escrowId,
              sender_id: data.sender_id,
              content: data.content,
              created_at: data.created_at || new Date().toISOString(),
              sender: data.sender
            };
            
            setMessages(prev => [...prev, message]);
          } else if (data.type === 'history') {
            // Load message history
            setMessages(data.messages || []);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setConnectionError('Connection lost. Chat service unavailable.');
        
        // Don't attempt to reconnect automatically to prevent infinite loops
        // when backend is not running
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Chat service unavailable. Backend may not be running.');
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setConnectionError('Chat service unavailable. Backend may not be running.');
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isConnected || !wsRef.current) return;

    const messageData = {
      type: 'message',
      content: newMessage.trim(),
      escrow_id: escrowId,
      sender_id: user?.id
    };

    try {
      wsRef.current.send(JSON.stringify(messageData));
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
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
                  <p className="text-sm text-gray-600">
                    Escrow #{escrowId}
                  </p>
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
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    No messages yet
                  </h4>
                  <p className="text-gray-600">
                    Start the conversation by sending a message.
                  </p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.sender_id === user?.id;
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwn
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {!isOwn && (
                          <p className="text-xs font-medium mb-1 opacity-75">
                            {message.sender?.first_name} {message.sender?.last_name}
                          </p>
                        )}
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          isOwn ? 'text-primary-100' : 'text-gray-500'
                        }`}>
                          {formatRelativeTime(message.created_at)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-6 border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={isConnected ? "Type your message..." : "Connecting..."}
                  className="input flex-1"
                  disabled={!isConnected}
                />
                <button
                  type="submit"
                  disabled={!isConnected || !newMessage.trim()}
                  className="btn btn-primary"
                >
                  <Send className="h-4 w-4" />
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
