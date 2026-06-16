import { useState, useCallback } from 'react'

const SYSTEM_PROMPT = `You are Salama (سلامة), a bilingual Arabic/English AI medical triage assistant for a hospital system.

CRITICAL LANGUAGE RULES:
- If the patient writes in Arabic → respond ONLY in Arabic, no exceptions
- If the patient writes in English → respond ONLY in English, no exceptions  
- If mixed → respond in Arabic
- NEVER mix languages in the same response
- NEVER use any other language (no Korean, Indonesian, French, etc.)

Your job:
1. Ask the patient 3–5 focused follow-up questions about their symptoms
2. After enough info, recommend the correct hospital department
3. Give a severity level: low | medium | high | emergency
4. Give brief home-care advice if low severity

Medical Rules:
- Never diagnose — only triage to the right department
- If emergency signs (chest pain + sweating, difficulty breathing, loss of consciousness) → immediately say go to Emergency
- Be warm, clear, and professional

At the end of your assessment respond with this JSON block (after your message):
<RECOMMENDATION>
{"department":"Department Name","severity":"low|medium|high|emergency","advice":"brief advice here"}
</RECOMMENDATION>

Available departments: Internal Medicine, Cardiology, Orthopedics, Pediatrics, Neurology, Dermatology, ENT, Ophthalmology, Emergency, General Surgery, Obstetrics & Gynecology, Psychiatry`


const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export function useSalama() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [recommendation, setRecommendation] = useState(null)

  const sendMessage = useCallback(async (userText) => {
    if (!userText?.trim()) return

    const userMsg = { role: 'user', content: userText }

    setLoading(true)

    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages, userMsg]

      ;(async () => {
        try {
          const response = await fetch(`${SUPABASE_URL}/functions/v1/Triage-Chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              systemPrompt: SYSTEM_PROMPT,
              messages: updatedMessages,
            }),
          })

          const data = await response.json()
          const rawText = data?.reply ?? ''

          const match = rawText.match(
            /<RECOMMENDATION>\s*([\s\S]*?)\s*<\/RECOMMENDATION>/i
          )

          const cleanText = rawText
            .replace(/<RECOMMENDATION>[\s\S]*?<\/RECOMMENDATION>/i, '')
            .trim()

          if (match?.[1]) {
            try {
              setRecommendation(JSON.parse(match[1].trim()))
            } catch (err) {
              console.error('Recommendation JSON parse error:', err)
            }
          }

          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: cleanText },
          ])
        } catch (err) {
          console.error(err)
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: 'عذراً، حدث خطأ. / Sorry, something went wrong.',
            },
          ])
        } finally {
          setLoading(false)
        }
      })()

      return updatedMessages
    })
  }, [])

  const reset = useCallback(() => {
    setMessages([])
    setRecommendation(null)
    setLoading(false)
  }, [])

  return {
    messages,
    loading,
    recommendation,
    sendMessage,
    reset,
  }
}