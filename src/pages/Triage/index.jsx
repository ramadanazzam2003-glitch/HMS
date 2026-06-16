import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Stethoscope } from 'lucide-react'
import TriageHeader from './TriageHeader'
import ChatBubble from './ChatBubble'
import RecommendCard from './RecommendCard'
import { useSalama } from './useSalama'

const WELCOME = {
  role: 'assistant',
  content: 'مرحباً! أنا سلامة، مساعدك الطبي. 👋\nHello! I\'m Salama, your medical triage assistant.\n\nأخبرني عن أعراضك وسأساعدك في تحديد القسم المناسب.\nTell me your symptoms and I\'ll help guide you to the right department.'
}

export default function Triage() {
  const { messages, loading, recommendation, sendMessage } = useSalama()
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, recommendation])

  const handleSend = () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    sendMessage(text)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <TriageHeader />

      <div className="flex-1 overflow-y-auto px-4 pt-4">
        <ChatBubble message={WELCOME} />
        {messages.map((msg, i) => <ChatBubble key={i} message={msg} />)}

        {loading && (
          <div className="flex justify-start mb-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-2 shrink-0">
              <Stethoscope size={14} className="text-green-600" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]"/>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"/>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"/>
            </div>
          </div>
        )}

        {recommendation && <RecommendCard recommendation={recommendation} />}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-100 px-4 py-3 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="اكتب أعراضك... / Describe your symptoms..."
            rows={1}
            dir="auto"
            className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 max-h-32"
          />
          <motion.button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center disabled:opacity-40 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4 text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
