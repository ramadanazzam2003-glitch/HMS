import { motion } from 'framer-motion'
import { Stethoscope } from 'lucide-react'

export default function ChatBubble({ message }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      {!isUser && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center mr-2 shrink-0 self-end mb-0.5"
          style={{
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.25)',
          }}
        >
          <Stethoscope size={12} style={{ color: '#10b981' }} />
        </div>
      )}

      <div
        className="max-w-[78%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line"
        dir="auto"
        style={isUser ? {
          background: 'linear-gradient(135deg,#2563eb,#3b82f6)',
          color: '#fff',
          borderRadius: '18px 18px 4px 18px',
        } : {
          background: '#1e293b',
          color: '#e2e8f0',
          borderRadius: '18px 18px 18px 4px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {message.content}
      </div>
    </motion.div>
  )
}