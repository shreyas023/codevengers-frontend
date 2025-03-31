"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Copy, Check, Trash, User, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

export default function Chat() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    // Add user message to chat
    const userMessage = { role: "user", content: prompt };
    setMessages(prev => [...prev, userMessage]);
    
    setLoading(true);
    setPrompt("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      
      // Add AI response to chat
      setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
    } catch (error) {
      setMessages(prev => [
        ...prev, 
        { role: "assistant", content: "Sorry, I encountered an error processing your request." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="max-w-4xl mx-auto p-4 flex flex-col h-screen">
        <header className="py-6 text-center">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            AI Assistant
          </h1>
          <p className="text-gray-300 mt-2">Ask anything, get intelligent answers</p>
        </header>

        {/* Chat messages container */}
        <div className="flex-1 overflow-y-auto rounded-lg bg-gray-800 bg-opacity-50 backdrop-blur-sm border border-gray-700 mb-4 p-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Bot size={48} className="mx-auto mb-4 opacity-50" />
                <p>Start a conversation with the AI</p>
                <p className="text-sm mt-2">Try asking something like:</p>
                <div className="mt-4 space-y-2">
                  {["Explain quantum computing", "Write a poem about stars", "How to make pasta from scratch"].map((suggestion) => (
                    <button
                      key={suggestion}
                      className="block w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                      onClick={() => {
                        setPrompt(suggestion);
                        inputRef.current?.focus();
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-3xl rounded-2xl p-4 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-gray-700 text-white rounded-tl-none"
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      {message.role === "user" ? (
                        <User size={16} className="mr-2" />
                      ) : (
                        <Bot size={16} className="mr-2" />
                      )}
                      <span className="font-medium">
                        {message.role === "user" ? "You" : "AI Assistant"}
                      </span>
                    </div>
                    
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          code({node, inline, className, children, ...props}) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={atomDark}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            )
                          }
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>

                    {message.role === "assistant" && (
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => copyToClipboard(message.content)}
                          className="text-gray-400 hover:text-white transition p-1"
                          title="Copy to clipboard"
                        >
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input form */}
        <div className="relative">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="absolute -top-12 right-0 flex items-center gap-1 px-3 py-1 text-sm bg-red-500 hover:bg-red-600 rounded-md transition-colors"
            >
              <Trash size={14} /> Clear Chat
            </button>
          )}
          
          <form onSubmit={handleSubmit} className="relative">
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask something..."
              className="w-full p-4 pr-12 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              required
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}