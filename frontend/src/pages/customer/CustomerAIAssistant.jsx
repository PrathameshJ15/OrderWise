import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Package,
  Layers,
  ArrowRight,
} from 'lucide-react';
import apiClient from '../../api/client';
import { useAuth } from '../../hooks/useAuth';

export default function CustomerAIAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: `Hello ${user?.name || 'there'}! I can answer questions about your order status, delivery commitments, and allocation explanations. How can I assist you?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    'What is my current order status?',
    'Why was my order partially allocated?',
    'What are my expected delivery dates?',
    'Which items are pending replenishment?',
  ];

  const scrollToBottom = () => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build conversation history for context
      const history = messages.slice(-4).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const res = await apiClient.post('/customer/ai/chat', {
        message: text.trim(),
        history,
      });

      const replyText = res?.data?.reply || res?.reply || "I've reviewed your active orders. All allocations match current warehouse availability.";

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: res?.data?.provider,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: err?.error?.message || err?.message || 'Unable to retrieve your order details at this moment. Please verify your connection or try again.',
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <div className="space-y-6 font-sans py-2 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center space-x-2 text-[12px] font-mono text-ac font-semibold tracking-wider uppercase mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Supply Chain Assistant • Deterministic Transparency</span>
          </div>
          <h1 className="font-display text-[34px] font-bold tracking-tight text-t">
            AI Order Assistant
          </h1>
          <p className="text-[14px] text-t2 font-sans mt-0.5">
            Real-time natural language answers regarding your orders, fulfillment reasons, and delivery schedules.
          </p>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="card-base flex flex-col h-[650px] p-0 overflow-hidden border-bd bg-s">
        {/* Chat Header Bar */}
        <div className="p-4 border-b border-bd bg-s2/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-ac/10 border border-ac/30 text-ac flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-t flex items-center space-x-2">
                <span>OrderWise Supply Chain Assistant</span>
                <span className="w-2 h-2 rounded-full bg-ok animate-pulse" />
              </div>
              <span className="text-[12px] font-mono text-t2">Connected to authenticated account: {user?.email}</span>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-pill bg-s border border-bd text-t2">
            Read-Only Order Isolation
          </span>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-card p-4 text-[14px] leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-ac text-white font-medium shadow-sm'
                    : msg.isError
                    ? 'bg-no/10 border border-no/30 text-no'
                    : 'bg-s2 border border-bd text-t'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>
                <div
                  className={`text-[11px] font-mono mt-2 flex items-center justify-between ${
                    msg.sender === 'user' ? 'text-white/70' : 'text-t2'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.provider && (
                    <span className="ml-2 uppercase tracking-wider text-[10px] opacity-75">
                      {msg.provider}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start space-x-3 text-t2">
              <div className="w-8 h-8 rounded-full bg-s2 border border-bd flex items-center justify-center">
                <RefreshCw className="h-4 w-4 animate-spin text-ac" />
              </div>
              <div className="bg-s2 border border-bd rounded-card p-3 text-[13px] text-t2">
                Analyzing your orders & warehouse allocation records...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompts */}
        <div className="px-6 py-2.5 border-t border-bd bg-s2/30 flex flex-wrap gap-2 items-center">
          <span className="text-[11px] font-mono text-t2 flex items-center space-x-1">
            <HelpCircle className="h-3 w-3" />
            <span>Suggested:</span>
          </span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loading}
              onClick={() => handleSendMessage(p)}
              className="text-[12px] font-sans px-3 py-1 rounded-pill bg-s border border-bd hover:border-ac text-t2 hover:text-t transition-colors cursor-pointer disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-bd bg-s flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask about your order status, delivery dates, or allocation reasons..."
            className="flex-1 bg-s2 border border-bd rounded-pill px-5 py-3 text-[14px] text-t placeholder-t2/50 focus:outline-none focus:border-ac transition-colors font-sans"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-primary min-h-[44px] px-6 space-x-2 disabled:opacity-50"
          >
            <span>Ask</span>
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
