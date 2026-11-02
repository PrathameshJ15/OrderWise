import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  CheckCircle,
  XCircle,
  Edit3,
  AlertTriangle,
  RefreshCw,
  Quote,
  ShieldAlert,
  Info,
  Calendar,
  ChevronDown,
  ChevronUp,
  BookmarkCheck,
  MessageSquare,
  Send,
  Bot,
  User,
  Trash2,
  TrendingUp,
  Layers,
} from 'lucide-react';
import apiClient from '../../api/client';
import { PriorityPill, ConfidencePill, RecommendationStatusPill } from '../../components/ui/StatusPill';
import Modal from '../../components/ui/Modal';
import ForecastDepthVisual from '../../components/3d/ForecastDepthVisual';

export default function AIRecommendations() {
  const [activeTab, setActiveTab] = useState('review'); // 'review' | 'chatbot'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [filter, setFilter] = useState('all'); // all, pending, approved, overridden, rejected
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Chatbot state
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: "👋 Hello! I am your **OrderWise AI Assistant**. I can explain allocation decisions, analyze inventory bottlenecks, answer priority sorting questions, and guide you through simulations. What would you like to know?",
      suggestions: [
        'Which product is our biggest inventory bottleneck?',
        'Why was Alice’s order deferred?',
        'How does the allocation engine break priority ties?',
      ],
      time: 'Just now',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // Modal state for Modify action
  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [activeRecommendation, setActiveRecommendation] = useState(null);
  const [overridePriority, setOverridePriority] = useState('HIGH');
  const [overrideReason, setOverrideReason] = useState('');

  // Expandable details state per order
  const [expandedOrders, setExpandedOrders] = useState({});

  // Demand Forecasting state (Phase 17)
  const [forecasts, setForecasts] = useState([]);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastAlpha, setForecastAlpha] = useState(0.3);

  const fetchForecasts = useCallback(async (alpha = forecastAlpha) => {
    setForecastLoading(true);
    try {
      await ensureAdminAuth();
      const res = await apiClient.get(`/intelligence/forecast?alpha=${alpha}`);
      setForecasts(res.data?.data?.forecasts || res.data?.forecasts || []);
    } catch (err) {
      console.warn('Forecast fetch error:', err);
    } finally {
      setForecastLoading(false);
    }
  }, [forecastAlpha]);

  // Auth helper: ensures token exists for admin demo
  const ensureAdminAuth = async () => {
    let token = localStorage.getItem('orderwise_token');
    if (!token) {
      try {
        const res = await apiClient.post('/auth/login', {
          email: 'admin@orderwise.com',
          password: 'Admin123!',
        });
        if (res.data?.token) {
          localStorage.setItem('orderwise_token', res.data.token);
        }
      } catch (err) {
        console.warn('Auto-login error:', err);
      }
    }
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await ensureAdminAuth();
      const res = await apiClient.get('/orders');
      setOrders(res.data?.orders || []);
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const toggleExpand = (orderId) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'chatbot') {
      scrollToBottom();
    }
  }, [chatMessages, activeTab]);

  const handleSendChat = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || chatLoading) return;
    setInputMessage('');
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text,
      time: nowTime,
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);

    try {
      await ensureAdminAuth();
      const history = chatMessages.slice(-6).map((m) => ({ sender: m.sender, text: m.text }));
      const res = await apiClient.post('/ai/chat', { message: text, history });
      const data = res.data?.data || res.data || {};
      const botMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: data.reply || 'Analysis completed.',
        suggestions: data.suggestions || [],
        provider: data.provider,
        model: data.model,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: '⚠️ Unable to reach assistant right now: ' + (err?.error?.message || err?.message || 'Server error'),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, errMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleResetChat = () => {
    setChatMessages([
      {
        id: Date.now(),
        sender: 'assistant',
        text: "👋 Chat reset. I am your **OrderWise AI Assistant Chatbot**. Ask me anything about order allocations, inventory shortages, or simulation experiments!",
        suggestions: [
          'Which product is our biggest inventory bottleneck?',
          'Why was Alice’s order deferred?',
          'How does the allocation engine break priority ties?',
        ],
        time: 'Just now',
      },
    ]);
  };

  const handleAskAboutOrder = (order) => {
    setActiveTab('chatbot');
    const prompt = `Explain why Order #${order.id} for customer ${order.customer_name || 'Customer'} was assigned priority ${order.approved_priority || order.latest_recommendation?.suggested_priority || 'MEDIUM'}, and analyze its allocation status.`;
    handleSendChat(prompt);
  };

  // Request new AI recommendation
  const handleRequestRecommendation = async (orderId) => {
    setActionLoading((prev) => ({ ...prev, [`rec-${orderId}`]: true }));
    setError(null);
    setSuccessMessage(null);
    try {
      await apiClient.post(`/ai/recommend/${orderId}`, {});
      setSuccessMessage(`AI Priority Recommendation generated for Order #${orderId}!`);
      await fetchOrders();
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to generate recommendation');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`rec-${orderId}`]: false }));
    }
  };

  // Approve recommendation
  const handleApprove = async (recommendation) => {
    setActionLoading((prev) => ({ ...prev, [`approve-${recommendation.id}`]: true }));
    setError(null);
    setSuccessMessage(null);
    try {
      await apiClient.post('/priorities/approve', {
        recommendation_id: recommendation.id,
        decision: 'approved',
        reason: 'Approved AI recommendation via admin console',
      });
      setSuccessMessage(
        `Recommendation #${recommendation.id} approved! Order priority updated to ${recommendation.suggested_priority}.`
      );
      await fetchOrders();
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to approve recommendation');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`approve-${recommendation.id}`]: false }));
    }
  };

  // Reject recommendation
  const handleReject = async (recommendation) => {
    setActionLoading((prev) => ({ ...prev, [`reject-${recommendation.id}`]: true }));
    setError(null);
    setSuccessMessage(null);
    try {
      await apiClient.post('/priorities/approve', {
        recommendation_id: recommendation.id,
        decision: 'rejected',
        reason: 'Rejected recommendation - business context does not warrant suggested priority',
      });
      setSuccessMessage(
        `Recommendation #${recommendation.id} rejected. Authoritative priority remains unchanged.`
      );
      await fetchOrders();
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to reject recommendation');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`reject-${recommendation.id}`]: false }));
    }
  };

  // Open Modify modal
  const openModifyModal = (recommendation) => {
    setActiveRecommendation(recommendation);
    setOverridePriority(recommendation.suggested_priority || 'HIGH');
    setOverrideReason('');
    setModifyModalOpen(true);
  };

  // Submit Modify override
  const handleModifySubmit = async (e) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      setError('An override rationale is required to document priority modification.');
      return;
    }

    setActionLoading((prev) => ({ ...prev, [`modify-${activeRecommendation.id}`]: true }));
    setError(null);
    try {
      await apiClient.post('/priorities/approve', {
        recommendation_id: activeRecommendation.id,
        decision: 'overridden',
        final_priority: overridePriority,
        override_reason: overrideReason.trim(),
      });
      setSuccessMessage(
        `Priority modified to ${overridePriority} with governance audit log.`
      );
      setModifyModalOpen(false);
      await fetchOrders();
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to modify priority');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`modify-${activeRecommendation?.id}`]: false }));
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const rec = order.latest_recommendation;
    if (filter === 'all') return true;
    if (filter === 'pending') return rec && rec.status === 'pending';
    if (filter === 'approved') return rec && rec.status === 'approved';
    if (filter === 'overridden') return rec && rec.status === 'overridden';
    if (filter === 'rejected') return rec && rec.status === 'rejected';
    if (filter === 'no_rec') return !rec;
    return true;
  });

  return (
    <div className="space-y-6 font-sans py-2">
      {/* Clean Page Header (No excessive bordered box) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center space-x-2 text-[12px] font-mono text-ac font-semibold tracking-wider uppercase mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Order Governance</span>
          </div>
          <h1 className="font-display text-[34px] font-bold tracking-tight text-t">
            AI Priority Assistant
          </h1>
          <p className="text-[14px] text-t2 font-sans mt-0.5">
            Core Principle: <span className="text-t font-medium">AI recommends. Business rules validate. Authorized humans approve. OrderWise allocates.</span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="btn-secondary min-h-[42px] flex items-center space-x-2 px-4 py-2 text-[13px]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Orders</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[14px]">
        <div className="card-base p-4">
          <span className="text-t2 block text-[11px] font-mono">Total Orders</span>
          <span className="text-[34px] font-display font-bold text-t mt-1 block">{orders.length}</span>
        </div>
        <div className="p-4 bg-[#2B2010]/60 rounded-card border border-alert-border">
          <span className="text-wa block text-[11px] font-mono font-medium">Pending AI Review</span>
          <span className="text-[34px] font-display font-bold text-wa mt-1 block">
            {orders.filter((o) => o.latest_recommendation?.status === 'pending').length}
          </span>
        </div>
        <div className="card-base p-4 border-ok/30">
          <span className="text-ok block text-[11px] font-mono font-medium">Human Approved</span>
          <span className="text-[34px] font-display font-bold text-ok mt-1 block">
            {orders.filter((o) => o.latest_recommendation?.status === 'approved').length}
          </span>
        </div>
        <div className="card-base p-4 border-ac/30">
          <span className="text-ac block text-[11px] font-mono font-medium">Human Modified</span>
          <span className="text-[34px] font-display font-bold text-ac mt-1 block">
            {orders.filter((o) => o.latest_recommendation?.status === 'overridden').length}
          </span>
        </div>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="p-4 bg-[#291313] border border-no/40 text-no rounded-card text-[13px] flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-[#102416] border border-ok/40 text-ok rounded-card text-[13px] flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Primary View Switcher: Approvals vs Chatbot */}
      <div className="flex items-center gap-2.5 pb-2 overflow-x-auto touch-scroll flex-nowrap w-full">
        <button
          onClick={() => setActiveTab('review')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-pill text-[14px] font-semibold transition-colors border ${
            activeTab === 'review'
              ? 'bg-ac text-white border-ac'
              : 'bg-s text-t2 border-bd hover:text-t hover:border-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Priority Approvals & Review</span>
          <span className="ml-1 px-2 py-0.5 text-[11px] rounded-pill bg-black/30 font-mono">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('chatbot')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-pill text-[14px] font-semibold transition-colors border ${
            activeTab === 'chatbot'
              ? 'bg-ac text-white border-ac'
              : 'bg-s text-t2 border-bd hover:text-t hover:border-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Interactive AI Assistant Chatbot</span>
          <span className="ml-1 px-2 py-0.5 text-[11px] rounded-pill bg-ok/20 text-ok border border-ok/30 font-mono">
            Live Copilot
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('forecast');
            fetchForecasts();
          }}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-pill text-[14px] font-semibold transition-colors border ${
            activeTab === 'forecast'
              ? 'bg-ac text-white border-ac'
              : 'bg-s text-t2 border-bd hover:text-t hover:border-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Demand Forecasting &amp; Shortage Risk</span>
          <span className="ml-1 px-2 py-0.5 text-[11px] rounded-pill bg-ac/20 text-ac border border-ac/30 font-mono">
            Phase 17
          </span>
        </button>
      </div>

      {activeTab === 'chatbot' ? (
        <div className="card-base flex flex-col h-[650px] p-0 overflow-hidden">
          {/* Chatbot Top Toolbar */}
          <div className="p-4 border-b border-bd bg-s2/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-ac/15 border border-ac/40 text-ac flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-t">
                    OrderWise Intelligent Co-Pilot Chatbot
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-pill bg-ok/20 text-ok border border-ok/30 font-mono">
                    Online
                  </span>
                </div>
                <p className="text-[12px] text-t2 mt-0.5">
                  AI-Assisted Decision Support • Allocation Explainer • Live Inventory Context
                </p>
              </div>
            </div>

            <button
              onClick={handleResetChat}
              className="btn-header flex items-center space-x-1.5 px-3 py-1.5 text-[12px]"
              title="Reset conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Chat</span>
            </button>
          </div>

          {/* Quick Prompts Strip */}
          <div className="px-4 py-2.5 border-b border-bd bg-s2/30 flex items-center gap-2 overflow-x-auto text-[13px]">
            <span className="text-t2 text-[11px] font-mono whitespace-nowrap">
              Suggested:
            </span>
            {[
              '🔥 Which product is our biggest inventory bottleneck?',
              '📦 Why was Alice’s order deferred?',
              '⚖️ How does the allocation engine break priority ties?',
              '🧪 What happens during a demand surge simulation?',
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendChat(prompt.replace(/^[^\s]+\s/, ''))}
                disabled={chatLoading}
                className="whitespace-nowrap px-3 py-1 rounded-pill bg-s2 border border-bd hover:border-white text-t2 hover:text-t transition-colors text-[12px]"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-ac/20 border border-ac/50 text-ac flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-card border p-4 text-[14px] ${
                    msg.sender === 'user'
                      ? 'bg-ac/15 border-ac/40 text-white'
                      : 'bg-s2 border-bd text-t'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-bd/40 text-[11px] text-t2 font-mono">
                    <span className="font-bold text-ac">
                      {msg.sender === 'user' ? 'Admin (You)' : 'OrderWise AI Assistant'}
                    </span>
                    <span>{msg.time}</span>
                  </div>

                  <div className="whitespace-pre-wrap leading-relaxed space-y-2 text-[14px]">
                    {msg.text}
                  </div>

                  {/* Follow-up question chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-bd/40 space-y-1.5">
                      <span className="text-[11px] text-t2 font-mono block">
                        Suggested Follow-ups:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestions.map((sug, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendChat(sug)}
                            disabled={chatLoading}
                            className="text-[12px] px-3 py-1 rounded-pill bg-s border border-bd hover:border-ac text-t2 hover:text-t transition-colors text-left"
                          >
                            → {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-s2 border border-bd text-t flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {chatLoading && (
              <div className="flex gap-3 justify-start items-center text-[13px] text-t2">
                <div className="w-8 h-8 rounded-full bg-ac/20 border border-ac/50 text-ac flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3.5 bg-s2 border border-bd rounded-card flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-ac" />
                  <span>OrderWise AI is analyzing allocation rules & generating response...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat();
            }}
            className="p-3.5 border-t border-bd bg-s2/60 flex items-center gap-2.5"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask OrderWise AI (e.g. Why was Order #101 deferred? What is the Pressure Gauge bottleneck?)..."
              disabled={chatLoading}
              className="flex-1 px-4 py-2.5 rounded-pill text-[14px] bg-s border border-bd focus:border-ac text-t focus:outline-none placeholder-t2/60"
            />
            <button
              type="submit"
              disabled={chatLoading || !inputMessage.trim()}
              className="btn-primary flex items-center space-x-1.5 px-3.5 sm:px-6 py-2.5 text-[14px] disabled:opacity-50 shrink-0 touch-tap"
            >
              {chatLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Send</span>
            </button>
          </form>
        </div>
      ) : activeTab === 'forecast' ? (
        <div className="space-y-6">
          {/* Phase 17 Header */}
          <div className="card-base bg-s2/40 border border-bd">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-[11px] font-mono text-ac uppercase font-bold tracking-wider">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Phase 17 AI Demand Forecasting &amp; Shortage Risk</span>
                </div>
                <h2 className="text-[20px] font-bold text-t mt-1">
                  Horizon Projections &amp; Shortage Risk Radar
                </h2>
                <p className="text-[13px] text-t2 mt-0.5 max-w-3xl leading-relaxed">
                  Deterministic exponential smoothing with expanding 95% confidence intervals (&plusmn;1.96 &times; &sigma; &times; &radic;h) over 7-day and 30-day projection horizons. Categorizes inventory shortage risks and exposes data sparsity flags.
                </p>
              </div>

              <div className="flex items-center space-x-3 self-start md:self-auto">
                <div className="flex items-center space-x-2 rounded-pill border border-bd bg-s px-3 py-1.5 text-[12px] text-t2">
                  <span>Smoothing Factor (&alpha;):</span>
                  <select
                    value={forecastAlpha}
                    onChange={(e) => {
                      const newAlpha = parseFloat(e.target.value);
                      setForecastAlpha(newAlpha);
                      fetchForecasts(newAlpha);
                    }}
                    className="bg-transparent border-none text-t font-mono font-bold outline-none cursor-pointer"
                  >
                    <option value="0.1" className="bg-s text-t">0.1 (Slow/Stable)</option>
                    <option value="0.3" className="bg-s text-t">0.3 (Standard)</option>
                    <option value="0.5" className="bg-s text-t">0.5 (Responsive)</option>
                    <option value="0.8" className="bg-s text-t">0.8 (Rapid Trend)</option>
                  </select>
                </div>

                <button
                  onClick={() => fetchForecasts(forecastAlpha)}
                  disabled={forecastLoading}
                  className="btn-secondary px-4 py-2 text-[13px] flex items-center space-x-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${forecastLoading ? 'animate-spin' : ''}`} />
                  <span>Recalculate</span>
                </button>
              </div>
            </div>
          </div>

          {/* Non-speculative Disclaimer Banner */}
          <div className="p-4 rounded-card border border-ac/30 bg-[#241212] flex items-start space-x-3 text-[12px] text-t">
            <ShieldAlert className="w-4 h-4 text-ac flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-mono font-bold text-ac uppercase tracking-wider text-[11px]">
                EXPERIMENTAL_ESTIMATE &bull; Non-Speculative Predictive Advisory
              </div>
              <p className="text-t2 text-[12px] leading-relaxed">
                Demand forecasting is an assistive mathematical model designed to highlight potential stockout risks. In accordance with OrderWise deterministic governance, forecasts <strong className="text-t">never trigger automated replenishment or allocation modifications</strong> without authoritative human review and approval.
              </p>
            </div>
          </div>

          {/* 3D Horizon Depth Radar Visual */}
          <ForecastDepthVisual forecasts={forecasts} />

          {/* Forecasting Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {forecasts.map((f) => {
              const riskColor =
                f.shortage_risk_classification === 'SHORTAGE_RISK_HIGH'
                  ? 'border-no/50 bg-[#2B1515] text-no'
                  : f.shortage_risk_classification === 'SHORTAGE_RISK_MEDIUM'
                  ? 'border-wa/50 bg-[#2B2010] text-wa'
                  : 'border-ok/50 bg-[#102416] text-ok';

              const riskBadgeText =
                f.shortage_risk_classification === 'SHORTAGE_RISK_HIGH'
                  ? 'CRITICAL SHORTAGE RISK'
                  : f.shortage_risk_classification === 'SHORTAGE_RISK_MEDIUM'
                  ? 'MEDIUM SHORTAGE RISK'
                  : 'STOCK ADEQUATE';

              return (
                <div key={`fc-${f.product_id}`} className="card-base p-5 border border-bd flex flex-col justify-between">
                  <div>
                    {/* Header: Name, SKU, Risk Badge */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-[17px] font-bold text-t">{f.product_name}</h3>
                        <span className="text-[12px] font-mono text-t2">{f.sku}</span>
                      </div>

                      <span className={`px-2.5 py-1 rounded-pill text-[11px] font-mono font-bold uppercase border ${riskColor}`}>
                        {riskBadgeText}
                      </span>
                    </div>

                    {/* Stock & Velocity Strip */}
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-card bg-s2 border border-bd mb-4 text-center font-mono">
                      <div>
                        <div className="text-[10px] text-t2 uppercase">Available Stock</div>
                        <div className="text-[18px] font-bold text-t mt-0.5">{f.available_inventory}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-t2 uppercase">Daily Velocity</div>
                        <div className="text-[18px] font-bold text-ac mt-0.5">{f.avg_daily_demand} <span className="text-[11px] text-t2">u/d</span></div>
                      </div>
                      <div>
                        <div className="text-[10px] text-t2 uppercase">Daily Volatility</div>
                        <div className="text-[18px] font-bold text-t2 mt-0.5">&plusmn;{f.daily_std_dev || 0}</div>
                      </div>
                    </div>

                    {/* Horizons Breakdown */}
                    <div className="space-y-3 font-mono text-[13px]">
                      {/* 7-Day Horizon */}
                      <div className="p-3 rounded-card border border-bd/70 bg-s">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-t font-bold flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-ac" />
                            <span>7-Day Projected Horizon</span>
                          </span>
                          <span className="text-t font-bold text-[14px]">
                            {f.horizon_7d?.projected_demand} units
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-t2">
                          <span>95% Confidence Interval:</span>
                          <span className="text-t1 font-bold">
                            [{f.horizon_7d?.lower_ci_95} &ndash; {f.horizon_7d?.upper_ci_95} units]
                          </span>
                        </div>
                      </div>

                      {/* 30-Day Horizon */}
                      <div className="p-3 rounded-card border border-bd/70 bg-s">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-t font-bold flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-ac" />
                            <span>30-Day Projected Horizon</span>
                          </span>
                          <span className="text-t font-bold text-[14px]">
                            {f.horizon_30d?.projected_demand} units
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-t2">
                          <span>95% Confidence Interval:</span>
                          <span className="text-t1 font-bold">
                            [{f.horizon_30d?.lower_ci_95} &ndash; {f.horizon_30d?.upper_ci_95} units]
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer: Data Quality Flag */}
                  <div className="mt-4 pt-3 border-t border-bd/60 flex items-center justify-between text-[11px] font-mono text-t2">
                    <div className="flex items-center space-x-1.5">
                      <span>Data Quality:</span>
                      <span className={`px-2 py-0.5 rounded-pill font-bold uppercase text-[10px] border ${
                        f.data_quality_flag === 'SUFFICIENT'
                          ? 'border-ok/40 bg-ok/10 text-ok'
                          : f.data_quality_flag === 'SPARSE_DATA'
                          ? 'border-wa/40 bg-wa/10 text-wa'
                          : 'border-bd bg-s2 text-t2'
                      }`}>
                        {f.data_quality_flag}
                      </span>
                    </div>

                    <span className="text-[10px] text-t2">
                      &alpha; = {f.alpha_used || forecastAlpha} &bull; Exponential Smoothing
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {forecasts.length === 0 && (
            <div className="card-base text-center py-12 text-t2">
              {forecastLoading ? 'Calculating forecast horizons...' : 'No products available for forecasting.'}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Filter Tabs */}
          <div className="card-base p-3 flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Orders' },
              { key: 'pending', label: 'Pending Review' },
              { key: 'approved', label: 'Approved' },
              { key: 'overridden', label: 'Modified' },
              { key: 'rejected', label: 'Rejected' },
              { key: 'no_rec', label: 'Needs AI Analysis' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`px-4 py-1.5 rounded-pill text-[12px] font-mono transition-colors border ${
                  filter === t.key
                    ? 'border-ac bg-ac text-white font-bold'
                    : 'border-bd bg-s2 text-t2 hover:text-t'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Orders & Recommendations List */}
          {loading ? (
            <div className="card-base p-12 text-center text-t2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-ac" />
              <p className="text-[12px] font-mono">Loading orders & AI priority recommendations...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="card-base p-12 text-center text-t2">
              <Info className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-[14px]">No orders found for selected filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const rec = order.latest_recommendation;
                const isExpanded = !!expandedOrders[order.id];

                return (
                  <div
                    key={order.id}
                    className="card-base p-0 overflow-hidden"
                  >
                    {/* Order Top Bar */}
                    <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-bd/60 bg-s2/40">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-mono font-bold text-lg text-t">
                            ORDER #{order.id}
                          </span>
                          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-pill border border-bd bg-s2 text-t2">
                            Status: {order.status}
                          </span>
                          {/* Authoritative Priority Badge */}
                          <div className="flex items-center space-x-1.5 text-[13px]">
                            <span className="text-t2 text-[12px]">Authoritative Priority:</span>
                            <PriorityPill priority={order.approved_priority || 'MEDIUM'} />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-t2">
                          <span>Customer: <strong className="text-t">{order.customer_name}</strong></span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Promised:{' '}
                            <strong className="text-t font-mono">
                              {order.promised_delivery_date
                                ? new Date(order.promised_delivery_date).toLocaleDateString()
                                : 'N/A'}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Actions / Rec Request */}
                      <div className="flex items-center space-x-2">
                        {!rec ? (
                          <button
                            onClick={() => handleRequestRecommendation(order.id)}
                            disabled={actionLoading[`rec-${order.id}`]}
                            className="btn-primary flex items-center space-x-2 px-4 py-2 text-[13px]"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>
                              {actionLoading[`rec-${order.id}`] ? 'Analyzing...' : 'Request AI Analysis'}
                            </span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRequestRecommendation(order.id)}
                            disabled={actionLoading[`rec-${order.id}`]}
                            title="Re-run AI Analysis"
                            className="btn-header flex items-center space-x-1.5 px-3 py-1.5 text-[12px]"
                          >
                            <RefreshCw
                              className={`w-3.5 h-3.5 ${actionLoading[`rec-${order.id}`] ? 'animate-spin' : ''}`}
                            />
                            <span>Re-Analyze</span>
                          </button>
                        )}

                        <button
                          onClick={() => toggleExpand(order.id)}
                          className="p-2 rounded-full border border-bd text-t2 hover:text-t hover:border-white transition-colors"
                          title={isExpanded ? 'Collapse Items' : 'Expand Items'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Items Accordion (if expanded) */}
                    {isExpanded && order.items && order.items.length > 0 && (
                      <div className="p-4 bg-s2/60 border-b border-bd text-[13px] space-y-2">
                        <span className="text-[11px] font-mono text-t2 block">
                          Order Items:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {order.items.map((it) => (
                            <div key={it.id} className="p-3 rounded-card border border-bd bg-s space-y-0.5">
                              <div className="font-bold text-t">{it.product_name}</div>
                              <div className="text-[12px] font-mono text-t2">
                                SKU: {it.sku} • Requested: <strong className="text-t">{it.requested_quantity}</strong> (Min: {it.minimum_acceptable_quantity})
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Customer Business Notes */}
                    {order.business_notes && (
                      <div className="px-5 py-3 bg-s2/30 border-b border-bd text-[13px] flex items-start space-x-2.5">
                        <ShieldAlert className="w-4 h-4 text-t2 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[11px] font-mono text-t2 block">
                            Customer Business Notes (Treated Strictly as Data):
                          </span>
                          <p className="text-t italic">&ldquo;{order.business_notes}&rdquo;</p>
                        </div>
                      </div>
                    )}

                    {/* AI Recommendation Box */}
                    {rec ? (
                      <div className="p-5 space-y-4">
                        {/* Recommendation Top Metadata Strip */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-bd">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[13px] text-t2">
                              AI Suggested Priority:
                            </span>
                            <PriorityPill priority={rec.suggested_priority} className="text-sm px-3 py-1" />
                            <ConfidencePill confidence={rec.confidence} />
                            <RecommendationStatusPill status={rec.status} />
                          </div>

                          {/* Traceability Badges (Model & Prompt Version) */}
                          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                            <span
                              className={`px-2.5 py-0.5 rounded-pill border ${
                                rec.provider === 'fallback'
                                  ? 'border-wa/40 bg-wa/10 text-wa'
                                  : 'border-ac/30 bg-ac/10 text-ac'
                              }`}
                            >
                              Provider: {rec.provider === 'fallback' ? 'Rule-Based Fallback' : 'Groq AI'}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-pill border border-bd bg-s2 text-t2">
                              Model: {rec.model || 'llama3-70b-8192'}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-pill border border-bd bg-s2 text-t2">
                              Prompt: {rec.prompt_version || 'v1.0.0'}
                            </span>
                          </div>
                        </div>

                        {/* Recommendation Explanation */}
                        <div className="space-y-2 text-[14px]">
                          <div>
                            <span className="text-[11px] font-mono text-t2 block mb-1">
                              Rationale & Explanation:
                            </span>
                            <p className="text-t leading-relaxed bg-s2 p-4 rounded-card border border-bd">
                              {rec.explanation}
                            </p>
                          </div>

                          {/* Supporting Evidence Quote */}
                          {rec.evidence && (
                            <div>
                              <span className="text-[11px] font-mono text-t2 block mb-1">
                                Supporting Evidence:
                              </span>
                              <div className="flex items-start space-x-2.5 p-3 rounded-card bg-s2 border border-bd text-t2">
                                <Quote className="w-4 h-4 text-ac flex-shrink-0 mt-0.5" />
                                <span className="italic text-t">&ldquo;{rec.evidence}&rdquo;</span>
                              </div>
                            </div>
                          )}

                          {/* Warning Banner */}
                          {rec.warning && (
                            <div className="p-3.5 bg-[#2B2010] border border-[#5A4210] text-wa rounded-card flex items-start space-x-2 text-[13px]">
                              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span>{rec.warning}</span>
                            </div>
                          )}
                        </div>

                        {/* Human Decision Governance Actions */}
                        <div className="pt-3 border-t border-bd flex flex-wrap items-center justify-between gap-3">
                          <div className="text-[13px]">
                            {rec.status === 'pending' ? (
                              <span className="text-wa">
                                ⚠️ Awaiting authorized human review before updating authoritative priority.
                              </span>
                            ) : rec.status === 'approved' ? (
                              <span className="text-ok flex items-center gap-1.5">
                                <BookmarkCheck className="w-4 h-4" />
                                Approved by Admin • Authoritative Priority updated to {order.approved_priority}.
                              </span>
                            ) : rec.status === 'overridden' ? (
                              <span className="text-ac flex items-center gap-1.5">
                                <Edit3 className="w-4 h-4" />
                                Modified by Admin • Authoritative Priority set to {order.approved_priority}.
                              </span>
                            ) : (
                              <span className="text-no flex items-center gap-1.5">
                                <XCircle className="w-4 h-4" />
                                Recommendation Rejected • Original priority remained unchanged.
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            {/* Ask AI Chatbot */}
                            <button
                              onClick={() => handleAskAboutOrder(order)}
                              className="btn-header flex items-center space-x-1.5 px-3 py-1.5 text-[12px]"
                              title="Ask AI Chatbot to explain this order"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-ac" />
                              <span>Ask Copilot</span>
                            </button>

                            {/* Approve Action */}
                            <button
                              onClick={() => handleApprove(rec)}
                              disabled={actionLoading[`approve-${rec.id}`]}
                              className="btn-header flex items-center space-x-1.5 px-3.5 py-1.5 text-[12px] font-bold text-ok border-ok/40 hover:bg-ok/10"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>

                            {/* Modify Action */}
                            <button
                              onClick={() => openModifyModal(rec)}
                              disabled={actionLoading[`modify-${rec.id}`]}
                              className="btn-header flex items-center space-x-1.5 px-3.5 py-1.5 text-[12px] font-bold text-wa border-wa/40 hover:bg-wa/10"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Modify</span>
                            </button>

                            {/* Reject Action */}
                            <button
                              onClick={() => handleReject(rec)}
                              disabled={actionLoading[`reject-${rec.id}`]}
                              className="btn-header flex items-center space-x-1.5 px-3.5 py-1.5 text-[12px] font-bold text-no border-no/40 hover:bg-no/10"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-s2/30 text-[13px] text-t2 flex items-center justify-between">
                        <span>No AI recommendation on record for this order.</span>
                        <button
                          onClick={() => handleRequestRecommendation(order.id)}
                          disabled={actionLoading[`rec-${order.id}`]}
                          className="btn-primary text-[12px] px-3.5 py-1.5 flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Run AI Priority Assistant</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modify Modal Dialog */}
      <Modal
        isOpen={modifyModalOpen}
        onClose={() => setModifyModalOpen(false)}
        title="Modify AI Priority Recommendation"
      >
        <form onSubmit={handleModifySubmit} className="space-y-4 text-[14px]">
          <div>
            <span className="text-t2 block text-[12px] font-mono mb-1.5">AI Recommendation ID:</span>
            <div className="p-3 bg-s2 rounded-card border border-bd font-mono text-t text-[13px]">
              #{activeRecommendation?.id} • Suggested: {activeRecommendation?.suggested_priority}
            </div>
          </div>

          <div>
            <label className="block text-t font-medium mb-2">
              Select Authoritative Priority:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setOverridePriority(p)}
                  className={`p-3 rounded-pill text-center font-mono font-bold text-[13px] transition-colors border ${
                    overridePriority === p
                      ? 'border-ac bg-ac text-white'
                      : 'border-bd bg-s2 text-t2 hover:text-t hover:border-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-t font-medium mb-1.5">
              Modification Rationale / Justification <span className="text-no">*</span>:
            </label>
            <textarea
              rows={3}
              required
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. VIP client SLA requires expedited priority classification despite standard business notes."
              className="w-full p-3 bg-s2 rounded-card border border-bd text-t focus:border-ac focus:outline-none placeholder-t2/50 text-[14px]"
            />
            <span className="text-[12px] text-t2 mt-1 block">
              This reason will be permanently recorded in priority_approvals and audit_logs.
            </span>
          </div>

          <div className="pt-4 border-t border-bd flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setModifyModalOpen(false)}
              className="btn-header px-5 py-2 text-[14px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading[`modify-${activeRecommendation?.id}`]}
              className="btn-primary px-6 py-2 text-[14px]"
            >
              Confirm Modification
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
