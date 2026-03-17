'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  { label: '💰 Check balance',   prompt: 'What is my current wallet balance?' },
  { label: '🏅 My badges',       prompt: 'Show me my B2S NFT badges and their value' },
  { label: '📊 Pool stats',      prompt: 'What are the current B2S liquidity pool stats?' },
  { label: '🌉 Bridge activity', prompt: 'Show recent cross-chain bridge activity' },
  { label: '📈 STX price',       prompt: 'What is the current STX price?' },
  { label: '🚀 DeFi strategy',   prompt: 'Give me a DeFi strategy for B2S tokens with medium risk' },
];

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role:      'agent',
      content:   '👋 Hey! I\'m **B2S Agent**, powered by Claude AI.\n\nI can help you:\n• 💰 Check wallet balances (STX + $B2S)\n• 📈 Get live crypto prices\n• 🏅 Check your NFT badges\n• 🌉 Track bridge activity\n• 💎 Calculate staking rewards\n• 🚀 Get DeFi strategy advice\n\nWhat would you like to do?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [isOpen, setIsOpen]         = useState(false);
  const messagesEndRef              = useRef<HTMLDivElement>(null);
  const inputRef                    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  async function sendMessage(text?: string) {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: msg, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Build history for context (exclude welcome message)
    const history = messages
      .filter((_, i) => i > 0) // skip welcome
      .map(m => ({
        role:    m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));

    const agentMsg: Message = { role: 'agent', content: '', timestamp: new Date() };
    setMessages(prev => [...prev, agentMsg]);

    try {
      const res = await fetch('/api/agent', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: msg, history }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText  = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              fullText += parsed.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...agentMsg, content: fullText };
                return updated;
              });
            }
            if (parsed.error) {
              fullText = `❌ ${parsed.error}`;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...agentMsg, content: fullText };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...agentMsg,
          content: '❌ Agent error. Please check your `ANTHROPIC_API_KEY` in Vercel env variables.',
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  function formatContent(content: string) {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.1);padding:1px 4px;border-radius:3px;font-size:11px">$1</code>')
      .replace(/\n/g, '<br/>');
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-2xl transition-all duration-300 hover:scale-110"
        style={{
          background: 'linear-gradient(135deg, #f97316, #8b5cf6)',
          boxShadow:  '0 8px 32px rgba(249,115,22,0.4)',
        }}
        title="B2S AI Agent"
        aria-label="Open B2S Agent"
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Chat panel */}
      <div
        className="fixed bottom-24 right-6 z-50 flex flex-col transition-all duration-300"
        style={{
          width:           380,
          height:          560,
          opacity:         isOpen ? 1 : 0,
          pointerEvents:   isOpen ? 'all' : 'none',
          transform:       isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
          transformOrigin: 'bottom right',
        }}
      >
        <div
          className="flex flex-col h-full rounded-2xl overflow-hidden border"
          style={{
            background:  '#0d1120',
            borderColor: 'rgba(255,255,255,0.08)',
            boxShadow:   '0 25px 80px rgba(0,0,0,0.6)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#080b12' }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #f97316, #8b5cf6)' }}
            >
              🤖
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-white">B2S Agent</div>
              <div className="text-xs truncate" style={{ color: '#64748b' }}>
                AI-powered blockchain assistant
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e' }}
              />
              <span className="text-xs" style={{ color: '#22c55e' }}>Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'agent' && (
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1"
                    style={{ background: 'linear-gradient(135deg, #f97316, #8b5cf6)' }}
                  >
                    🤖
                  </div>
                )}
                <div
                  className="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={
                    msg.role === 'user'
                      ? { background: '#f97316', color: 'white', borderBottomRightRadius: 4 }
                      : { background: '#111827', color: '#e2e8f0', borderBottomLeftRadius: 4, border: '1px solid rgba(255,255,255,0.06)' }
                  }
                  dangerouslySetInnerHTML={{
                    __html: msg.content
                      ? formatContent(msg.content)
                      : loading && i === messages.length - 1
                        ? '<span style="opacity:0.4">●●●</span>'
                        : '',
                  }}
                />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <div className="text-xs mb-2" style={{ color: '#64748b' }}>Quick actions</div>
              <div className="grid grid-cols-2 gap-1.5">
                {QUICK_ACTIONS.map(a => (
                  <button
                    key={a.label}
                    onClick={() => sendMessage(a.prompt)}
                    className="text-left px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-[1.02]"
                    style={{ background: '#111827', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.06)' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask anything about B2S..."
                disabled={loading}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: '#e2e8f0' }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all"
                style={{
                  background: input.trim() && !loading ? '#f97316' : '#1e293b',
                  color:      input.trim() && !loading ? 'white'   : '#64748b',
                }}
              >
                {loading ? '⏳' : '↑'}
              </button>
            </div>
            <div className="text-center text-xs mt-2" style={{ color: '#334155' }}>
              Powered by Claude · Anthropic
            </div>
          </div>
        </div>
      </div>
    </>
  );
}