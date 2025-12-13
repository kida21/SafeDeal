import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageCircle } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { formatRelativeTime } from "../lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message } from "../types";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  escrowId: number;
}

const ChatModal = ({ isOpen, onClose, escrowId }: ChatModalProps) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, ] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock messages for demonstration
  useEffect(() => {
    if (isOpen) {
      const mockMessages: Message[] = [
        {
          id: 1,
          escrow_id: escrowId,
          sender_id: user?.id || 1,
          content: "Hello! I'm **ready** to proceed with the transaction.",
          created_at: new Date(Date.now() - 3600000).toISOString(),
          sender: {
            id: user?.id || 1,
            first_name: user?.first_name || "You",
            last_name: user?.last_name || "",
            email: user?.email || "",
            activated: true,
            created_at: "",
            updated_at: "",
            profession: ""
          },
        },
        {
          id: 2,
          escrow_id: escrowId,
          sender_id: 2,
          content:
            "Great! I've accepted the escrow. Please proceed with the payment.\n\n- [ ] Send money\n- [ ] Confirm item",
          created_at: new Date(Date.now() - 1800000).toISOString(),
          sender: {
            id: 2,
            first_name: "John",
            last_name: "Doe",
            email: "john@example.com",
            activated: true,
            created_at: "",
            updated_at: "",
            profession: ""
          },
        },
        {
          id: 3,
          escrow_id: escrowId,
          sender_id: user?.id || 1,
          content:
            "Payment has been made. Please confirm when you receive the item.\n\n`inline code example`",
          created_at: new Date(Date.now() - 900000).toISOString(),
          sender: {
            id: user?.id || 1,
            first_name: user?.first_name || "You",
            last_name: user?.last_name || "",
            email: user?.email || "",
            activated: true,
            created_at: "",
            updated_at: "",
            profession: ""
          },
        },
      ];
      setMessages(mockMessages);
    }
  }, [isOpen, escrowId, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: Message = {
      id: messages.length + 1,
      escrow_id: escrowId,
      sender_id: user?.id || 1,
      content: newMessage,
      created_at: new Date().toISOString(),
      sender: {
        id: user?.id || 1,
        first_name: user?.first_name || "You",
        last_name: user?.last_name || "",
        email: user?.email || "",
        activated: true,
        created_at: "",
        updated_at: "",
        profession: ""
      },
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");

    // TODO: Send message via WebSocket or API in real app
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
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => {
                const isOwn = message.sender_id === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isOwn
                          ? "bg-primary-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      {!isOwn && (
                        <p className="text-xs font-medium mb-1 opacity-75">
                          {message.sender?.first_name} {message.sender?.last_name}
                        </p>
                      )}
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      <p
                        className={`text-xs mt-1 ${
                          isOwn ? "text-primary-100" : "text-gray-500"
                        }`}
                      >
                        {formatRelativeTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-6 border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message with markdown..."
                  className="input flex-1"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !newMessage.trim()}
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

export default ChatModal;
