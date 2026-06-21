import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Stethoscope, RotateCcw, ChevronRight } from 'lucide-react'
import ChatBubble from './ChatBubble'
import RecommendCard from './RecommendCard'
import { useSalama } from './useSalama'
import { useTheme } from '../../contexts/ThemeContext'
/* import Navbar from '../../components/Navbar' */

const WELCOME = {
  role: 'assistant',
  content: 'مرحباً! أنا سلامة، مساعدك الطبي الذكي. 👋\nHello! I\'m Salama, your AI medical triage assistant.\n\nأخبرني عن أعراضك وسأساعدك في تحديد القسم المناسب.\nTell me your symptoms and I\'ll help guide you to the right department.'
}

const QUICK_PROMPTS = [
  { ar: 'ألم في الصدر', en: 'Chest pain' },
  { ar: 'صداع شديد', en: 'Severe headache' },
  { ar: 'ألم في البطن', en: 'Stomach pain' },
  { ar: 'ضيق في التنفس', en: 'Breathing difficulty' },
]

export default function Triage() {
  const { messages, loading, recommendation, sendMessage, reset } = useSalama()
  const [input, setInput] = useState('')
  const [lang, setLang] = useState('ar')
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, recommendation, loading])

  const handleSend = () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    textareaRef.current?.focus()
    sendMessage(text)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleQuick = (p) => {
    const text = lang === 'ar' ? p.ar : p.en
    sendMessage(text)
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--triage-bg)' }}>
      <style>{`
        ${isDark ? `
          --triage-bg: #0a0e1a;
          --triage-surface: #111827;
          --triage-card: #1a2235;
          --triage-border: rgba(255,255,255,0.07);
          --triage-text: #f1f5f9;
          --triage-muted: #64748b;
          --triage-ai-bubble: #1e293b;
        ` : `
          --triage-bg: #f8fafc;
          --triage-surface: #ffffff;
          --triage-card: #f1f5f9;
          --triage-border: rgba(0,0,0,0.08);
          --triage-text: #1e293b;
          --triage-muted: #64748b;
          --triage-ai-bubble: #e2e8f0;
        `}
        --triage-accent: #3b82f6;
        --triage-accent-glow: rgba(59,130,246,0.15);
        --triage-green: #10b981;
        --triage-green-glow: rgba(16,185,129,0.12);
        --triage-user-bubble: linear-gradient(135deg,#2563eb,#3b82f6);
      `}</style>

      {/* Header */}
      <header style={{ background: 'var(--triage-surface)', borderBottom: '1px solid var(--triage-border)' }}
        className="flex items-center justify-between px-4 h-14 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--triage-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--triage-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--triage-muted)'}
          >
            <ChevronRight size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--triage-green-glow)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <Stethoscope size={14} style={{ color: 'var(--triage-green)' }} />
            </div>
            <div>
              <p className="text-xs font-semibold leading-none" style={{ color: 'var(--triage-text)' }}>سلامة · Salama</p>
              <p className="text-[10px] leading-none mt-0.5" style={{ color: 'var(--triage-green)' }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-1 animate-pulse" />
                AI Medical Triage
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Lang toggle */}
          <button onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')}
            className="text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all"
            style={{ background: 'var(--triage-card)', color: 'var(--triage-muted)', border: '1px solid var(--triage-border)' }}
          >
            {lang === 'ar' ? 'EN' : 'AR'}
          </button>
          {/* Reset */}
          {messages.length > 0 && (
            <button onClick={reset}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ background: 'var(--triage-card)', color: 'var(--triage-muted)', border: '1px solid var(--triage-border)' }}
              title="Start over"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">

        {/* Welcome */}
        <ChatBubble message={WELCOME} />

        {/* Quick prompts — only when empty */}
        <AnimatePresence>
          {isEmpty && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ delay: 0.3 }}
              className="pt-3 pb-1"
            >
              <p className="text-xs mb-2 px-1" style={{ color: 'var(--triage-muted)' }}>
                {lang === 'ar' ? 'اختر من الأعراض الشائعة:' : 'Common symptoms:'}
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((p, i) => (
                  <button key={i} onClick={() => handleQuick(p)}
                    className="text-xs px-3 py-1.5 rounded-full transition-all hover:scale-105"
                    style={{
                      background: 'var(--triage-card)',
                      border: '1px solid var(--triage-border)',
                      color: 'var(--triage-text)'
                    }}
                  >
                    {lang === 'ar' ? p.ar : p.en}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat messages */}
        {messages.map((msg, i) => <ChatBubble key={i} message={msg} />)}

        {/* Typing indicator */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-end gap-2 mb-3"
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'var(--triage-green-glow)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <Stethoscope size={12} style={{ color: 'var(--triage-green)' }} />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center"
                style={{ background: 'var(--triage-ai-bubble)' }}>
                {[0, 150, 300].map((delay, i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: 'var(--triage-muted)', animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recommendation */}
        {recommendation && <RecommendCard recommendation={recommendation} />}

        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3"
        style={{ background: 'var(--triage-surface)', borderTop: '1px solid var(--triage-border)' }}>
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={lang === 'ar' ? 'اكتب أعراضك...' : 'Describe your symptoms...'}
              rows={1}
              dir="auto"
              style={{
                background: 'var(--triage-card)',
                border: '1px solid var(--triage-border)',
                color: 'var(--triage-text)',
                caretColor: 'var(--triage-accent)',
              }}
              className="w-full resize-none rounded-2xl px-4 py-3 text-sm focus:outline-none max-h-32 transition-all placeholder-slate-500"
              onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
              onBlur={e => e.target.style.borderColor = 'var(--triage-border)'}
            />
          </div>
          <motion.button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all disabled:opacity-30"
            style={{
              background: input.trim() && !loading
                ? 'var(--triage-user-bubble)'
                : 'var(--triage-card)',
            }}
          >
            <Send className="w-4 h-4 text-white" />
          </motion.button>
        </div>
        <p className="text-center text-[10px] mt-2" style={{ color: 'var(--triage-muted)' }}>
          {lang === 'ar'
            ? 'سلامة لا تشخّص — تساعدك على التوجه للقسم المناسب'
            : 'Salama does not diagnose — she guides you to the right department'}
        </p>
      </div>
    </div>
  )
}