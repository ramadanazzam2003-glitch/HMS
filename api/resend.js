/* eslint-disable no-undef */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const RESEND_API_KEY = process.env.VITE_RESEND_API_KEY

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(req.body),
  })

  const data = await response.json()
  return res.status(response.ok ? 200 : response.status).json(data)
}